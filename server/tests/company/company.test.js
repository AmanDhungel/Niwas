import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { rmSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

let app;

import request from 'supertest';
import { create_user, create_admin_user } from '../helpers/factories.js';
import { get_auth_cookie, get_invalid_token_cookie } from '../helpers/auth.helper.js';
import { s3_mock, reset_s3_mocks } from '../mocks/s3.mock.js';
import company_model from '../../models/company.model.js';

const PNG_BYTES = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// ─── Local company factory ────────────────────────────────────────────────────
// The company schema marks address sub-fields as required, so every document
// must include a complete address object to satisfy Mongoose validation.

let _company_counter = 0;
const create_company = async (overrides = {}) => {
  const n = ++_company_counter;
  return company_model.create({
    name: `Company ${n}`,
    email: `company.${n}@example.com`,
    phone: `+977-98000000${n.toString().padStart(2, '0')}`,
    address: {
      address: `${n} Business Ave`,
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      zip_code: '94102',
    },
    ...overrides,
  });
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_company_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  _company_counter = 0;
  reset_s3_mocks();
});

afterAll(() => {
  const temp_dir = fileURLToPath(new URL('../../../uploads/tmp/', import.meta.url));
  if (existsSync(temp_dir)) {
    rmSync(temp_dir, { recursive: true, force: true });
  }
});

// ─── GET /api/company/ ────────────────────────────────────────────────────────

describe('GET /api/company/', () => {
  it('returns 200 with an empty array when no companies exist', async () => {
    const res = await request(app).get('/api/company/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Companies fetched successfully');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with an array containing the seeded company', async () => {
    await create_company({ name: 'Listed Company' });

    const res = await request(app).get('/api/company/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Companies fetched successfully');
    expect(res.body.data[0].name).toBe('Listed Company');
  });

  it('returns 200 with all seeded companies when multiple exist', async () => {
    await create_company({ name: 'Alpha Corp' });
    await create_company({ name: 'Beta Inc' });

    const res = await request(app).get('/api/company/');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

// ─── GET /api/company/:company_id ─────────────────────────────────────────────

describe('GET /api/company/:company_id', () => {
  it('returns 200 with the correct document when company exists', async () => {
    const company = await create_company({ name: 'Find Me Corp' });

    const res = await request(app).get(`/api/company/${company._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Company fetched successfully');
    expect(res.body.data._id).toBe(company._id.toString());
    expect(res.body.data.name).toBe('Find Me Corp');
  });

  it('returns 200 with activity_log as an array when populating performed_by', async () => {
    const company = await create_company();

    const res = await request(app).get(`/api/company/${company._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company fetched successfully');
    expect(Array.isArray(res.body.data.activity_log)).toBe(true);
  });

  it('returns 200 with contacts as an array on the company document', async () => {
    const company = await create_company();

    const res = await request(app).get(`/api/company/${company._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company fetched successfully');
    expect(Array.isArray(res.body.data.contacts)).toBe(true);
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/company/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).get('/api/company/not-an-objectid');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/company/add ────────────────────────────────────────────────────

describe('POST /api/company/add', () => {
  it('returns 201 with status success when admin sends valid name, email, and phone', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'New Company',
        email: 'new@company.com',
        phone: '+1-555-0001',
        address: JSON.stringify({ address: '1 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Company added successfully');
  });

  it('returns data.name matching the sent name value', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Name Check Corp',
        email: 'namecheck@company.com',
        phone: '+1-555-0002',
        address: JSON.stringify({ address: '2 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Company added successfully');
    expect(res.body.data.name).toBe('Name Check Corp');
  });

  it('seeds activity_log with one entry whose action is created', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Log Check Corp',
        email: 'log@company.com',
        phone: '+1-555-0003',
        address: JSON.stringify({ address: '3 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Company added successfully');
    expect(res.body.data.activity_log).toHaveLength(1);
    expect(res.body.data.activity_log[0].action).toBe('created');
    expect(res.body.data.activity_log[0].entity).toBe('company');
  });

  it('returns 500 when name is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        email: 'noname@company.com',
        phone: '+1-555-0004',
        address: JSON.stringify({ address: '4 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when email is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'No Email Corp',
        phone: '+1-555-0005',
        address: JSON.stringify({ address: '5 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when phone is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'No Phone Corp',
        email: 'nophone@company.com',
        address: JSON.stringify({ address: '6 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(regular)])
      .send({ name: 'Regular Attempt', email: 'reg@company.com', phone: '+1-555-0006' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(superuser)])
      .send({ name: 'Superuser Attempt', email: 'su@company.com', phone: '+1-555-0007' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(user_token, ...) is called bare with no guard.
    // When user_token is undefined (missing cookie), jwt.verify throws
    // JsonWebTokenError which propagates to the outer catch → 500.
    // Fix: guard user_token presence before verify, or wrap in try/catch returning 401.
    const res = await request(app)
      .post('/api/company/add')
      .send({ name: 'No Cookie Corp', email: 'nocookie@company.com', phone: '+1-555-0008' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when cookie contains a tampered JWT signed with the wrong secret', async () => {
    // Same root cause: jwt.verify throws JsonWebTokenError → outer catch → 500.
    // Fix: catch JsonWebTokenError / TokenExpiredError explicitly and return 401.
    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_invalid_token_cookie()])
      .send({ name: 'Tampered Corp', email: 'tampered@company.com', phone: '+1-555-0099' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 201 and data.tags contains both values when tags is JSON-stringified', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Tagged Corp',
        email: 'tagged@company.com',
        phone: '+1-555-0010',
        tags: JSON.stringify(['Enterprise', 'Platinum']),
        address: JSON.stringify({ address: '10 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Company added successfully');
    expect(res.body.data.tags).toContain('Enterprise');
    expect(res.body.data.tags).toContain('Platinum');
  });

  it('returns 201 and data.industry matches the sent value when a valid enum is provided', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'IT Corp',
        email: 'it@company.com',
        phone: '+1-555-0011',
        industry: 'it_software',
        address: JSON.stringify({ address: '11 Corp St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Company added successfully');
    expect(res.body.data.industry).toBe('it_software');
  });

  it('returns 201 and data.address reflects the parsed address object', async () => {
    const admin = await create_admin_user();
    const address_payload = { address: '42 Business Blvd', country: 'US', state: 'NY', city: 'New York', zip_code: '10001' };

    const res = await request(app)
      .post('/api/company/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Address Corp',
        email: 'address@company.com',
        phone: '+1-555-0012',
        address: JSON.stringify(address_payload),
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Company added successfully');
    expect(res.body.data.address.city).toBe('New York');
    expect(res.body.data.address.zip_code).toBe('10001');
  });
});

// ─── POST /api/company/edit/:company_id ───────────────────────────────────────

describe('POST /api/company/edit/:company_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_company has no authentication guard', async () => {
    // Controller gap: handle_edit_company reads no cookie, calls no jwt.verify, and
    // checks no user_type. Any unauthenticated caller can overwrite any company's fields.
    // Fix: add the same JWT + admin check used in handle_add_company (controller lines 87–97).
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ name: 'Unauthenticated Edit' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.name reflects the updated value', async () => {
    const company = await create_company({ name: 'Before Edit Corp' });

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ name: 'After Edit Corp' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.name).toBe('After Edit Corp');
  });

  it('returns 200 and data.email reflects the updated email value', async () => {
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ email: 'updated@company.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.email).toBe('updated@company.com');
  });

  it('returns 200 and data.phone reflects the updated phone value', async () => {
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ phone: '+1-555-7777' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.phone).toBe('+1-555-7777');
  });

  it('returns 200 and data.status reflects the updated status value', async () => {
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/edit/${unknown_id}`)
      .send({ name: 'Ghost Edit' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not overwrite existing name when a blank name is sent because sanitizePayload strips it', async () => {
    const company = await create_company({ name: 'Original Corp Name' });

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ name: '' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.name).toBe('Original Corp Name');
  });

  it('does not overwrite existing email when a blank email is sent because sanitizePayload strips it', async () => {
    const company = await create_company({ email: 'original@company.com' });

    const res = await request(app)
      .post(`/api/company/edit/${company._id}`)
      .send({ email: '' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Company updated successfully');
    expect(res.body.data.email).toBe('original@company.com');
  });
});

// ─── POST /api/company/delete/:company_id ────────────────────────────────────

describe('POST /api/company/delete/:company_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_company has no authentication guard', async () => {
    // Controller gap: handle_delete_company has no auth. Any unauthenticated caller
    // can permanently delete any company record.
    // Fix: add the JWT + admin check at the top of handle_delete_company.
    const company = await create_company();

    const res = await request(app).post(`/api/company/delete/${company._id}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with message Company deleted successfully', async () => {
    const company = await create_company();

    const res = await request(app).post(`/api/company/delete/${company._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Company deleted successfully');
  });

  it('company is actually removed from the database after deletion', async () => {
    const company = await create_company();

    await request(app).post(`/api/company/delete/${company._id}`);

    const found = await company_model.findById(company._id);
    expect(found).toBeNull();
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(`/api/company/delete/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/company/:company_id/notes/add ─────────────────────────────────

describe('POST /api/company/:company_id/notes/add', () => {
  it('returns 201 with status success when admin posts a note to an existing company', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Meeting Note')
      .field('note', 'Discussed contract terms');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Note added successfully');
  });

  it('returns data.title and data.note matching the sent values', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Follow Up')
      .field('note', 'Send proposal by Friday');

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Note added successfully');
    expect(res.body.data.title).toBe('Follow Up');
    expect(res.body.data.note).toBe('Send proposal by Friday');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Denied Note');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(superuser)])
      .field('title', 'Superuser Note Attempt');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(user_token, ...) is called bare — missing cookie
    // causes jwt.verify(undefined) to throw JsonWebTokenError → outer catch → 500.
    // Fix: guard user_token presence before verify, or catch JsonWebTokenError → 401.
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .field('title', 'No Cookie Note');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the company does not exist', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${unknown_id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Ghost Company Note');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('calls upload_file_to_s3 once when one attachment file is uploaded', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Note With Attachment')
      .attach('attachments', PNG_BYTES, { filename: 'note.png', contentType: 'image/png' });

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('calls upload_file_to_s3 twice when two attachment files are uploaded', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Note With Two Attachments')
      .attach('attachments', PNG_BYTES, { filename: 'first.png', contentType: 'image/png' })
      .attach('attachments', PNG_BYTES, { filename: 'second.png', contentType: 'image/png' });

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(2);
  });

  it('calls clear_temp_files once when auth fails with a file attached', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Auth Fail With File')
      .attach('attachments', PNG_BYTES, { filename: 'denied.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(s3_mock.clear_temp_files).toHaveBeenCalledTimes(1);
  });

  it('adds an activity_log entry to the company when a note is successfully created', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    await request(app)
      .post(`/api/company/${company._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Activity Log Note')
      .field('note', 'Check activity log');

    const updated = await company_model.findById(company._id);
    expect(updated.activity_log).toHaveLength(1);
    expect(updated.activity_log[0].action).toBe('created');
  });
});

// ─── POST /api/company/:company_id/notes/edit/:note_id ───────────────────────

describe('POST /api/company/:company_id/notes/edit/:note_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_note_on_company has no authentication guard', async () => {
    // Controller gap: handle_edit_note_on_company reads no cookie and checks no user_type.
    // Any unauthenticated caller can modify notes and their S3 attachments.
    // Fix: add the JWT + admin check at the top of handle_edit_note_on_company.
    const company = await create_company();
    company.notes.push({ title: 'Existing Note', note: 'existing body' });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('title', 'Unauthenticated Edit');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.title reflects the updated value', async () => {
    const company = await create_company();
    company.notes.push({ title: 'Old Title', note: 'Old note body' });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('title', 'Updated Title');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Note updated successfully');
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('returns 200 and data.note reflects the updated note text', async () => {
    const company = await create_company();
    company.notes.push({ title: 'Static Title', note: 'old body' });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('note', 'new body text');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Note updated successfully');
    expect(res.body.data.note).toBe('new body text');
  });

  it('returns 404 when the company does not exist', async () => {
    const unknown_company_id = new mongoose.Types.ObjectId();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${unknown_company_id}/notes/edit/${unknown_note_id}`)
      .field('title', 'Ghost Note');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the note_id does not exist on the company', async () => {
    const company = await create_company();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/edit/${unknown_note_id}`)
      .field('title', 'No Such Note');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('calls delete_file_from_s3 for an attachment removed via existing_attachments filtering', async () => {
    const company = await create_company();
    company.notes.push({
      title: 'Has Attachment',
      note: 'body',
      attachments: [{ file: 'https://bucket/old.png', key: 'company/old-key/old.png' }],
    });
    await company.save();
    const note_id = company.notes[0]._id;

    await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('existing_attachments', JSON.stringify([]));

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(1);
  });

  it('calls delete_file_from_s3 for each attachment removed when multiple exist', async () => {
    const company = await create_company();
    company.notes.push({
      title: 'Multi Attachments',
      note: 'body',
      attachments: [
        { file: 'https://bucket/a.png', key: 'company/key-a/a.png' },
        { file: 'https://bucket/b.png', key: 'company/key-b/b.png' },
      ],
    });
    await company.save();
    const note_id = company.notes[0]._id;

    await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('existing_attachments', JSON.stringify([]));

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(2);
  });

  it('calls upload_file_to_s3 once when a new attachment file is added during edit', async () => {
    const company = await create_company();
    company.notes.push({ title: 'Edit Upload Note', note: 'body' });
    await company.save();
    const note_id = company.notes[0]._id;

    await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .attach('attachments', PNG_BYTES, { filename: 'new-attach.png', contentType: 'image/png' });

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('preserves an existing attachment when it is included in existing_attachments', async () => {
    const company = await create_company();
    company.notes.push({
      title: 'Keep Attachment',
      note: 'body',
      attachments: [{ file: 'https://bucket/keep.png', key: 'company/keep-key/keep.png' }],
    });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/notes/edit/${note_id}`)
      .field('existing_attachments', JSON.stringify(['https://bucket/keep.png']));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Note updated successfully');
    expect(s3_mock.delete_file_from_s3).not.toHaveBeenCalled();
    expect(res.body.data.attachments).toHaveLength(1);
  });
});

// ─── POST /api/company/:company_id/notes/delete/:note_id ─────────────────────

describe('POST /api/company/:company_id/notes/delete/:note_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_note_from_company has no authentication guard', async () => {
    // Controller gap: handle_delete_note_from_company has no auth. Any unauthenticated
    // caller can delete notes and trigger S3 deletions for their attachments.
    // Fix: add the JWT + admin check at the top of handle_delete_note_from_company.
    const company = await create_company();
    company.notes.push({ title: 'Note To Protect', note: 'body' });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app).post(
      `/api/company/${company._id}/notes/delete/${note_id}`
    );

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with status success and the note is removed from DB', async () => {
    const company = await create_company();
    company.notes.push({ title: 'To Delete', note: 'will be gone' });
    await company.save();
    const note_id = company.notes[0]._id;

    const res = await request(app).post(
      `/api/company/${company._id}/notes/delete/${note_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Note deleted successfully');

    const refetched = await company_model.findById(company._id);
    expect(refetched.notes).toHaveLength(0);
  });

  it('calls delete_file_from_s3 once per attachment on the deleted note', async () => {
    const company = await create_company();
    company.notes.push({
      title: 'With Files',
      note: 'body',
      attachments: [
        { file: 'https://bucket/a.png', key: 'company/key-a/a.png' },
        { file: 'https://bucket/b.png', key: 'company/key-b/b.png' },
      ],
    });
    await company.save();
    const note_id = company.notes[0]._id;

    await request(app).post(
      `/api/company/${company._id}/notes/delete/${note_id}`
    );

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(2);
  });

  it('does not call delete_file_from_s3 when the deleted note has no attachments', async () => {
    const company = await create_company();
    company.notes.push({ title: 'No Files', note: 'clean note' });
    await company.save();
    const note_id = company.notes[0]._id;

    await request(app).post(
      `/api/company/${company._id}/notes/delete/${note_id}`
    );

    expect(s3_mock.delete_file_from_s3).not.toHaveBeenCalled();
  });

  it('returns 404 when the company does not exist', async () => {
    const unknown_company_id = new mongoose.Types.ObjectId();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/company/${unknown_company_id}/notes/delete/${unknown_note_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the note_id does not match any note on the company', async () => {
    const company = await create_company();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/company/${company._id}/notes/delete/${unknown_note_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/company/:company_id/call_log/add ───────────────────────────────

describe('POST /api/company/:company_id/call_log/add', () => {
  it('returns 201 with status success when admin posts a call log to an existing company', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'connected' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Call log added successfully');
  });

  it('returns data.status matching the sent call status value', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'busy' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Call log added successfully');
    expect(res.body.data.status).toBe('busy');
  });

  it('returns data.note matching the sent note value', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'no_answer', note: 'Called after hours' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Call log added successfully');
    expect(res.body.data.note).toBe('Called after hours');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(superuser)])
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(user_token, ...) is called bare — missing cookie
    // causes jwt.verify(undefined) to throw JsonWebTokenError → outer catch → 500.
    // Fix: guard user_token presence before verify, or catch JsonWebTokenError → 401.
    const company = await create_company();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the company does not exist', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${unknown_id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'wrong_number' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('adds an activity_log entry with action created when a call log is added', async () => {
    const admin = await create_admin_user();
    const company = await create_company();

    await request(app)
      .post(`/api/company/${company._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'connected', note: 'Productive call' });

    const updated = await company_model.findById(company._id);
    expect(updated.activity_log).toHaveLength(1);
    expect(updated.activity_log[0].entity).toBe('call_log');
    expect(updated.activity_log[0].action).toBe('created');
  });
});

// ─── POST /api/company/:company_id/call_log/edit/:call_log_id ────────────────

describe('POST /api/company/:company_id/call_log/edit/:call_log_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_call_log_on_company has no authentication guard', async () => {
    // Controller gap: handle_edit_call_log_on_company has no auth. Any unauthenticated
    // caller can modify any call log on any company.
    // Fix: add the JWT + admin check at the top of handle_edit_call_log_on_company.
    const company = await create_company();
    company.calls.push({ status: 'busy', note: 'initial' });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/edit/${call_log_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.status reflects the updated value', async () => {
    const company = await create_company();
    company.calls.push({ status: 'busy', note: 'initial note' });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/edit/${call_log_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Call log updated successfully');
    expect(res.body.data.status).toBe('connected');
  });

  it('returns 200 and data.note reflects the updated note field', async () => {
    const company = await create_company();
    company.calls.push({ status: 'connected', note: 'old note' });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/edit/${call_log_id}`)
      .send({ note: 'updated note text' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Call log updated successfully');
    expect(res.body.data.note).toBe('updated note text');
  });

  it('returns 200 and data.create_follow_up_task reflects the updated boolean', async () => {
    const company = await create_company();
    company.calls.push({ status: 'no_answer', create_follow_up_task: false });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/edit/${call_log_id}`)
      .send({ create_follow_up_task: true });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Call log updated successfully');
    expect(res.body.data.create_follow_up_task).toBe(true);
  });

  it('returns 404 when the company does not exist', async () => {
    const unknown_company_id = new mongoose.Types.ObjectId();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${unknown_company_id}/call_log/edit/${unknown_call_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the call_log_id does not match any call log on the company', async () => {
    const company = await create_company();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/company/${company._id}/call_log/edit/${unknown_call_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/company/:company_id/call_log/delete/:call_log_id ──────────────

describe('POST /api/company/:company_id/call_log/delete/:call_log_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_call_log_from_company has no authentication guard', async () => {
    // Controller gap: handle_delete_call_log_from_company has no auth. Any unauthenticated
    // caller can delete any call log from any company.
    // Fix: add the JWT + admin check at the top of handle_delete_call_log_from_company.
    const company = await create_company();
    company.calls.push({ status: 'connected', note: 'to be protected' });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app).post(
      `/api/company/${company._id}/call_log/delete/${call_log_id}`
    );

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and the company re-fetched from DB has an empty calls array', async () => {
    const company = await create_company();
    company.calls.push({ status: 'connected', note: 'to be deleted' });
    await company.save();
    const call_log_id = company.calls[0]._id;

    const res = await request(app).post(
      `/api/company/${company._id}/call_log/delete/${call_log_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Call log deleted successfully');

    const refetched = await company_model.findById(company._id);
    expect(refetched.calls).toHaveLength(0);
  });

  it('returns 200 even when the call_log_id does not exist because filter silently no-ops', async () => {
    const company = await create_company();
    const nonexistent_call_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/company/${company._id}/call_log/delete/${nonexistent_call_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Call log deleted successfully');
  });

  it('leaves other call logs intact when only the targeted one is deleted', async () => {
    const company = await create_company();
    company.calls.push({ status: 'busy', note: 'delete me' });
    company.calls.push({ status: 'connected', note: 'keep me' });
    await company.save();
    const call_to_delete = company.calls[0]._id;

    await request(app).post(
      `/api/company/${company._id}/call_log/delete/${call_to_delete}`
    );

    const refetched = await company_model.findById(company._id);
    expect(refetched.calls).toHaveLength(1);
    expect(refetched.calls[0].note).toBe('keep me');
  });

  it('returns 404 when the company does not exist', async () => {
    const unknown_company_id = new mongoose.Types.ObjectId();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/company/${unknown_company_id}/call_log/delete/${unknown_call_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
