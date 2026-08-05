import { jest } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

let app;

import request from 'supertest';
import { reset_s3_mocks } from '../mocks/s3.mock.js';
import attendance_model from '../../models/hrm/attendance/attendance.model.js';
import { create_user, create_attendance, create_employee } from '../helpers/factories.js';
import { get_auth_cookie, get_invalid_token_cookie } from '../helpers/auth.helper.js';

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_attendance_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  reset_s3_mocks();
});

// ─── Architectural note ───────────────────────────────────────────────────────
//
// The attendance route has NO `authenticate` middleware declared at the router
// level.  Each controller handler independently calls `get_user_from_cookie`,
// which calls jwt.verify() directly on `req.cookies.user_token`.
//
// Consequence for 401 tests:
//   - Missing cookie  → jwt.verify throws a TypeError → caught in the handler
//     catch block → 500 (not 401).  The 401 path is only reached when the
//     JWT is valid but user_model.findById returns null.
//   - Invalid JWT     → jwt.verify throws a JsonWebTokenError → 500.
//   - Valid JWT, user deleted from DB → user === null → 401 from handler.
//
// This is documented below as an open-access canary test for the missing-cookie
// path and tested at the correct status codes throughout the suite.

// ─── GAP [CRITICAL]: Missing router-level authenticate middleware ─────────────
//
// Every handler calls get_user_from_cookie() inline. When no cookie is present,
// jwt.verify(undefined) throws TypeError → caught generically → 500.
// The correct response is 401, which requires a router-level authenticate guard.
// Currently FAILS: endpoint returns 500 when no cookie is provided.

describe('Attendance route — missing router-level authenticate middleware', () => {
  it('returns 401 when no cookie is provided — gap: no router-level authenticate middleware, currently returns 500', async () => {
    const res = await request(app).get('/api/attendance/attendance');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── GET /api/attendance/attendance ──────────────────────────────────────────

describe('GET /api/attendance/attendance', () => {
  it('returns 200 with an empty array when the user has no attendance records', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee attendances fetched successfully');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with the user\'s own attendance records sorted by attendance_date descending', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    await create_attendance({ employee: user._id, attendance_date: '2025-04-01' });
    await create_attendance({ employee: user._id, attendance_date: '2025-04-03' });
    await create_attendance({ employee: user._id, attendance_date: '2025-04-02' });

    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee attendances fetched successfully');
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].attendance_date).toBe('2025-04-03');
    expect(res.body.data[1].attendance_date).toBe('2025-04-02');
    expect(res.body.data[2].attendance_date).toBe('2025-04-01');
  });

  it('returns only the requesting user\'s records and not those of another user', async () => {
    const user_a = await create_user();
    const user_b = await create_user();

    await create_attendance({ employee: user_a._id, attendance_date: '2025-04-10' });
    await create_attendance({ employee: user_b._id, attendance_date: '2025-04-10' });

    const cookie_a = get_auth_cookie(user_a);
    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie_a]);

    expect(res.status).toBe(200);
    // The controller stores user._id in the attendance.employee field (ref: "employee"),
    // so after populate the field holds the raw ObjectId string when no matching
    // employee document exists — we verify isolation by record count alone.
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 200 with each record containing attendance_date, attendance_status, and check_in fields', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const check_in_time = new Date();
    await create_attendance({
      employee: user._id,
      attendance_date: '2025-04-05',
      check_in: check_in_time,
      attendance_status: 'present',
    });

    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    const record = res.body.data[0];
    expect(record.attendance_date).toBe('2025-04-05');
    expect(record.attendance_status).toBe('present');
    expect(new Date(record.check_in).getTime()).toBeGreaterThan(0);
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .get('/api/attendance/attendance')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while fetching employee attendances');
  });
});

// ─── GET /api/attendance/stats ────────────────────────────────────────────────

describe('GET /api/attendance/stats', () => {
  it('returns 200 with the correct response envelope when no attendance data exists', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Attendance stats fetched successfully');
  });

  it('returns data with total_hours_today, total_hours_week, total_hours_month, and overtime_hours_month keys', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total_hours_today');
    expect(res.body.data).toHaveProperty('total_hours_week');
    expect(res.body.data).toHaveProperty('total_hours_month');
    expect(res.body.data).toHaveProperty('overtime_hours_month');
  });

  it('returns data.punch_state with is_punched_in false and is_on_break false when no record exists for today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.punch_state.is_punched_in).toBe(false);
    expect(res.body.data.punch_state.is_punched_out).toBe(false);
    expect(res.body.data.punch_state.is_on_break).toBe(false);
    expect(res.body.data.punch_state.check_in).toBeNull();
    expect(res.body.data.punch_state.check_out).toBeNull();
  });

  it('returns data.punch_state.is_punched_in true and is_punched_out false when the user has punched in today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({ employee: user._id, attendance_date: today, check_in: new Date() });

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.punch_state.is_punched_in).toBe(true);
    expect(res.body.data.punch_state.is_punched_out).toBe(false);
  });

  it('returns data.punch_state.is_punched_out true when the user has fully punched out today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    const check_in = new Date(Date.now() - 60 * 60 * 1000);
    const check_out = new Date();
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in,
      check_out,
      total_working_minutes: 60,
    });

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.punch_state.is_punched_in).toBe(true);
    expect(res.body.data.punch_state.is_punched_out).toBe(true);
  });

  it('returns data.punch_state.is_on_break true when break_start is set and break_end is null', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
      break_start: new Date(),
      break_end: null,
    });

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.punch_state.is_on_break).toBe(true);
  });

  it('returns data.today_breakdown with zero values when no attendance record exists for today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.today_breakdown.total_working_minutes).toBe(0);
    expect(res.body.data.today_breakdown.break_minutes).toBe(0);
    expect(res.body.data.today_breakdown.overtime_minutes).toBe(0);
  });

  it('returns data.total_hours_today.value as 0 when no record exists for today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.total_hours_today.value).toBe(0);
  });

  it('returns data.total_hours_month with a non-zero value when the user has a completed attendance for the current month', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const now = new Date();
    const this_month_date = new Date(now.getFullYear(), now.getMonth(), 2)
      .toISOString()
      .split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: this_month_date,
      check_in: new Date(now.getFullYear(), now.getMonth(), 2, 9, 0, 0),
      check_out: new Date(now.getFullYear(), now.getMonth(), 2, 17, 0, 0),
      total_working_minutes: 480,
    });

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.total_hours_month.value).toBeGreaterThan(0);
  });

  it('returns data.today_breakdown.total_working_minutes greater than 0 when the user is currently mid-shift', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      total_working_minutes: 120,
    });

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.today_breakdown.total_working_minutes).toBeGreaterThan(0);
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while fetching attendance stats');
  });
});

// ─── POST /api/attendance/punch_in ───────────────────────────────────────────

describe('POST /api/attendance/punch_in', () => {
  it('returns 201 with status success and message Punched in successfully', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Punched in successfully');
  });

  it('returns data with attendance_date matching today\'s date string in YYYY-MM-DD format', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);
    expect(res.body.data.attendance_date).toBe(today);
  });

  it('returns data with attendance_type set to regular and attendance_status set to present', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);
    expect(res.body.data.attendance_type).toBe('regular');
    expect(res.body.data.attendance_status).toBe('present');
  });

  it('returns data with check_in set and check_out absent because the user has not punched out yet', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);
    expect(res.body.data.check_in).toBeDefined();
    expect(res.body.data.check_out).toBeFalsy();
  });

  it('returns data with check_in_note when one is provided in the request body', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie])
      .send({ check_in_note: 'Starting early today' });

    expect(res.status).toBe(201);
    expect(res.body.data.check_in_note).toBe('Starting early today');
  });

  it('returns data with break_minutes as 0 and is_late as false by default', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);
    expect(res.body.data.break_minutes).toBe(0);
    expect(res.body.data.is_late).toBe(false);
  });

  it('persists the attendance record to the database so it is findable by employee and date', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(201);

    const found = await attendance_model.findOne({
      employee: user._id,
      attendance_date: today,
    });
    expect(found).not.toBeNull();
    expect(found._id.toString()).toBe(res.body.data._id);
  });

  it('returns 400 when the user tries to punch in a second time on the same day', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({ employee: user._id, attendance_date: today });

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('You have already punched in today');
  });

  it('does not create a second attendance record when the user attempts a duplicate punch-in', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({ employee: user._id, attendance_date: today });

    await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    const count = await attendance_model.countDocuments({
      employee: user._id,
      attendance_date: today,
    });
    expect(count).toBe(1);
  });

  it('allows a different user to punch in on the same day independently', async () => {
    const user_a = await create_user();
    const user_b = await create_user();
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({ employee: user_a._id, attendance_date: today });

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [get_auth_cookie(user_b)]);

    expect(res.status).toBe(201);
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while punching in');
  });
});

// ─── POST /api/attendance/punch_out ──────────────────────────────────────────

describe('POST /api/attendance/punch_out', () => {
  it('returns 200 with status success and message Punched out successfully', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Punched out successfully');
  });

  it('returns data with check_out set to a valid date after a successful punch-out', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.check_out).toBeDefined();
    expect(new Date(res.body.data.check_out).getTime()).toBeGreaterThan(0);
  });

  // ── GAP [MEDIUM]: total_working_minutes stores gross elapsed time, not net ──
  // Controller: total_working_minutes = diff_minutes(check_in, now) (gross).
  //             productive_minutes    = gross - break_minutes         (net).
  // The field name implies net productive time but stores gross elapsed time.
  // With break_minutes = 1 and elapsed ≈ 2 min: gross(2) ≠ net(1).
  // Currently FAILS: total_working_minutes stores gross, productive_minutes stores net.
  it('stores net productive time in total_working_minutes so it equals productive_minutes — gap: controller stores gross elapsed time in total_working_minutes', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 1000),
      break_minutes: 1,
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    // Both fields should equal net productive time (elapsed minus breaks).
    // Fails today because total_working_minutes = gross (≈2) but productive_minutes = net (≈1).
    expect(res.body.data.total_working_minutes).toBe(res.body.data.productive_minutes);
  });

  it('stores check_out_note when one is provided in the request body', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie])
      .send({ check_out_note: 'Leaving early for appointment' });

    expect(res.status).toBe(200);
    expect(res.body.data.check_out_note).toBe('Leaving early for appointment');
  });

  it('persists check_out to the database so re-fetch reflects the completed punch-out', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    const attendance = await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    const found = await attendance_model.findById(attendance._id);
    expect(found.check_out).not.toBeNull();
  });

  it('returns 404 when the user has not punched in today and tries to punch out', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('No punch-in found for today. Please punch in first.');
  });

  it('returns 400 when the user tries to punch out a second time on the same day', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      check_out: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('You have already punched out today');
  });

  it('returns 400 when the user tries to punch out while on an active break', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
      break_start: new Date(Date.now() - 10 * 60 * 1000),
      break_end: null,
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Please end your break before punching out');
  });

  it('calculates overtime_minutes as 0 when no expected_check_out is set', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.overtime_minutes).toBe(0);
  });

  it('calculates overtime_minutes greater than 0 when the user punches out after the expected_check_out time', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    const expected_out = new Date(Date.now() - 30 * 60 * 1000);
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expected_check_out: expected_out,
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.overtime_minutes).toBeGreaterThan(0);
  });

  it('preserves attendance_status as present after a successful punch-out', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.attendance_status).toBe('present');
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while punching out');
  });
});

// ─── POST /api/attendance/break/start ────────────────────────────────────────

describe('POST /api/attendance/break/start', () => {
  it('returns 200 with status success and message Break started successfully', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Break started successfully');
  });

  it('returns data with break_start set to a valid date and break_end as null', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.break_start).toBeDefined();
    expect(res.body.data.break_end).toBeNull();
  });

  it('persists break_start to the database so re-fetch reflects the active break', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    const attendance = await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
    });

    await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    const found = await attendance_model.findById(attendance._id);
    expect(found.break_start).not.toBeNull();
    expect(found.break_end).toBeNull();
  });

  it('returns 404 when the user has not punched in today and tries to start a break', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('No punch-in found for today. Please punch in first.');
  });

  it('returns 400 when the user tries to start a break after already punching out', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      check_out: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Cannot start break after punching out');
  });

  it('returns 400 when the user tries to start a break while already on one', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
      break_start: new Date(Date.now() - 10 * 60 * 1000),
      break_end: null,
    });

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('You are already on a break');
  });

  it('allows starting a new break after a previous break has been ended', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 60 * 60 * 1000),
      break_end: new Date(Date.now() - 30 * 60 * 1000),
      break_minutes: 30,
    });

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Break started successfully');
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while starting break');
  });
});

// ─── POST /api/attendance/break/end ──────────────────────────────────────────

describe('POST /api/attendance/break/end', () => {
  it('returns 200 with status success and message Break ended successfully', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 15 * 60 * 1000),
      break_end: null,
      break_minutes: 0,
    });

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Break ended successfully');
  });

  it('returns data with break_end set and break_minutes greater than 0 after ending a break', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 15 * 60 * 1000),
      break_end: null,
      break_minutes: 0,
    });

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.break_end).toBeDefined();
    expect(res.body.data.break_minutes).toBeGreaterThan(0);
  });

  it('accumulates break_minutes by adding the current break duration to the previous break_minutes total', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 3 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 10 * 60 * 1000),
      break_end: null,
      break_minutes: 20,
    });

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.break_minutes).toBeGreaterThanOrEqual(20);
  });

  it('persists break_end and updated break_minutes to the database so re-fetch reflects the ended break', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    const attendance = await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 20 * 60 * 1000),
      break_end: null,
      break_minutes: 0,
    });

    await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    const found = await attendance_model.findById(attendance._id);
    expect(found.break_end).not.toBeNull();
    expect(found.break_minutes).toBeGreaterThan(0);
  });

  it('returns 404 when the user has no punch-in record for today', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('No punch-in found for today.');
  });

  it('returns 400 when the user tries to end a break but no break_start is recorded', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 60 * 60 * 1000),
      break_start: null,
      break_end: null,
    });

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('No active break found');
  });

  it('returns 400 when break_end is already set meaning the break was already ended', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(Date.now() - 2 * 60 * 60 * 1000),
      break_start: new Date(Date.now() - 60 * 60 * 1000),
      break_end: new Date(Date.now() - 30 * 60 * 1000),
      break_minutes: 30,
    });

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Break has already ended');
  });

  it('returns 401 when the JWT references a user_id that does not exist in the database', async () => {
    const phantom_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(phantom_user);

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 500 when the cookie contains an invalid JWT because jwt.verify throws', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while ending break');
  });
});

// ─── GET /api/attendance/admin/todays_attendance ──────────────────────────────

describe('GET /api/attendance/admin/todays_attendance', () => {
  it('returns 200 with status success and message Today\'s attendances fetched successfully', async () => {
    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe("Today's attendances fetched successfully");
  });

  it('returns data with present_attendances and absent_employees keys', async () => {
    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('present_attendances');
    expect(res.body.data).toHaveProperty('absent_employees');
    expect(Array.isArray(res.body.data.present_attendances)).toBe(true);
    expect(Array.isArray(res.body.data.absent_employees)).toBe(true);
  });

  it('returns empty arrays for both present_attendances and absent_employees when no records exist', async () => {
    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(0);
    expect(res.body.data.absent_employees).toHaveLength(0);
  });

  it('returns the employee in absent_employees when an employee exists but has no attendance record for today', async () => {
    await create_employee({ name: 'Absent Employee' });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(0);
    expect(res.body.data.absent_employees).toHaveLength(1);
    const absent = res.body.data.absent_employees.find(e => e.name === 'Absent Employee');
    expect(absent).toBeDefined();
  });

  it('returns the attendance record in present_attendances when the attendance employee field stores a real employee document _id', async () => {
    const employee = await create_employee({ name: 'Present Employee' });
    const today = new Date().toISOString().split('T')[0];
    await create_attendance({
      employee: employee._id,
      attendance_date: today,
      check_in: new Date(),
    });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(1);
  });

  // ── GAP [HIGH]: null-dereference when attendance.employee is a user _id ───
  // handle_punch_in stores user._id in attendance.employee (ref: "employee").
  // handle_get_todays_attendance_admin calls .populate("employee") then accesses
  // a.employee._id. When no employee document has that _id, populate returns null
  // and the access crashes: TypeError: Cannot read properties of null (reading '_id').
  // Currently FAILS: endpoint returns 500 instead of 200.
  it('returns 200 when an attendance record stores a user _id in the employee field rather than a real employee document _id', async () => {
    const user = await create_user();
    const today = new Date().toISOString().split('T')[0];
    // Mimics what handle_punch_in does: stores user._id in attendance.employee.
    // populate("employee") finds no matching employee document → null.
    await create_attendance({
      employee: user._id,
      attendance_date: today,
      check_in: new Date(),
    });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    // Fails today: controller crashes on a.employee._id when populate returns null.
    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(1);
  });

  it('does not include employees who punched in today in the absent_employees list', async () => {
    const employee_present = await create_employee({ name: 'Present Worker' });
    const employee_absent = await create_employee({ name: 'Absent Worker' });
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({
      employee: employee_present._id,
      attendance_date: today,
      check_in: new Date(),
    });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);

    const present_ids = res.body.data.present_attendances.map(
      (a) => a.employee._id.toString()
    );
    const absent_ids = res.body.data.absent_employees.map((e) => e._id.toString());

    expect(present_ids).toContain(employee_present._id.toString());
    expect(absent_ids).toContain(employee_absent._id.toString());
    const overlap = present_ids.filter((id) => absent_ids.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('correctly separates present and absent employees when multiple employees exist', async () => {
    const employee_present = await create_employee({ name: 'Present One' });
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({
      employee: employee_present._id,
      attendance_date: today,
      check_in: new Date(),
    });

    await create_employee({ name: 'Absent One' });
    await create_employee({ name: 'Absent Two' });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(1);
    expect(res.body.data.absent_employees).toHaveLength(2);
  });

  it('does not include attendance records from previous days in present_attendances', async () => {
    const user = await create_user();
    await create_attendance({
      employee: user._id,
      attendance_date: '2025-01-01',
      check_in: new Date('2025-01-01T09:00:00Z'),
    });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(0);
  });

  it('returns present_attendances sorted by createdAt descending so the most recent punch-in appears first', async () => {
    const employee_a = await create_employee({ name: 'Employee Sort A' });
    const employee_b = await create_employee({ name: 'Employee Sort B' });
    const today = new Date().toISOString().split('T')[0];

    await create_attendance({ employee: employee_a._id, attendance_date: today, check_in: new Date(Date.now() - 10 * 60 * 1000) });
    await create_attendance({ employee: employee_b._id, attendance_date: today, check_in: new Date() });

    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.present_attendances).toHaveLength(2);

    const first_created = new Date(res.body.data.present_attendances[0].createdAt).getTime();
    const second_created = new Date(res.body.data.present_attendances[1].createdAt).getTime();
    expect(first_created).toBeGreaterThanOrEqual(second_created);
  });

  // ── GAP [CRITICAL]: No authenticate or permission_policy middleware on this route.
  // Any unauthenticated caller receives the full list of present/absent employee records.
  // Currently FAILS: endpoint returns 200 without any cookie.
  it('returns 401 when accessed without an authentication cookie — gap: no authenticate or permission_policy middleware on this admin route', async () => {
    const res = await request(app).get('/api/attendance/admin/todays_attendance');

    expect(res.status).toBe(401);
  });
});

// ─── End-to-end workflow ──────────────────────────────────────────────────────

describe('Full attendance workflow: punch-in → break start → break end → punch-out', () => {
  it('completes a full working-day cycle and produces correct cumulative state at each step', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    // Step 1: Punch in
    const punch_in_res = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(punch_in_res.status).toBe(201);
    expect(punch_in_res.body.data.check_in).toBeDefined();
    expect(punch_in_res.body.data.check_out).toBeFalsy();

    // Step 2: Start break
    const break_start_res = await request(app)
      .post('/api/attendance/break/start')
      .set('Cookie', [cookie]);

    expect(break_start_res.status).toBe(200);
    expect(break_start_res.body.data.break_start).toBeDefined();
    expect(break_start_res.body.data.break_end).toBeNull();

    // Step 3: End break
    const break_end_res = await request(app)
      .post('/api/attendance/break/end')
      .set('Cookie', [cookie]);

    expect(break_end_res.status).toBe(200);
    expect(break_end_res.body.data.break_end).toBeDefined();
    // break_start and break_end are called in immediate succession within this test,
    // so elapsed time is sub-second and diff_minutes rounds to 0 — 0 is the realistic minimum here.
    expect(break_end_res.body.data.break_minutes).toBeGreaterThanOrEqual(0);

    // Step 4: Punch out
    const punch_out_res = await request(app)
      .post('/api/attendance/punch_out')
      .set('Cookie', [cookie]);

    expect(punch_out_res.status).toBe(200);
    expect(punch_out_res.body.data.check_out).toBeDefined();
    expect(punch_out_res.body.data.total_working_minutes).toBeGreaterThanOrEqual(0);

    // Step 5: Verify DB record reflects the complete day
    const today = new Date().toISOString().split('T')[0];
    const final_record = await attendance_model.findOne({
      employee: user._id,
      attendance_date: today,
    });
    expect(final_record).not.toBeNull();
    expect(final_record.check_in).not.toBeNull();
    expect(final_record.check_out).not.toBeNull();
    expect(final_record.break_start).not.toBeNull();
    expect(final_record.break_end).not.toBeNull();
  });

  it('returns 400 for a second punch-in attempt after the full workflow completes', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    await request(app).post('/api/attendance/punch_in').set('Cookie', [cookie]);
    await request(app).post('/api/attendance/break/start').set('Cookie', [cookie]);
    await request(app).post('/api/attendance/break/end').set('Cookie', [cookie]);
    await request(app).post('/api/attendance/punch_out').set('Cookie', [cookie]);

    const second_punch_in = await request(app)
      .post('/api/attendance/punch_in')
      .set('Cookie', [cookie]);

    expect(second_punch_in.status).toBe(400);
    expect(second_punch_in.body.message).toBe('You have already punched in today');
  });

  it('stats endpoint reflects is_punched_in and is_punched_out true after a complete punch cycle', async () => {
    const user = await create_user();
    const cookie = get_auth_cookie(user);

    await request(app).post('/api/attendance/punch_in').set('Cookie', [cookie]);
    await request(app).post('/api/attendance/punch_out').set('Cookie', [cookie]);

    const stats_res = await request(app)
      .get('/api/attendance/stats')
      .set('Cookie', [cookie]);

    expect(stats_res.status).toBe(200);
    expect(stats_res.body.data.punch_state.is_punched_in).toBe(true);
    expect(stats_res.body.data.punch_state.is_punched_out).toBe(true);
    expect(stats_res.body.data.punch_state.is_on_break).toBe(false);
  });
});
