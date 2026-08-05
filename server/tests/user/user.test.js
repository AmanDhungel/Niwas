/**
 * tests/user/user.test.js
 *
 * Integration tests for the user module.
 *
 * Routes under test (mounted at /api/user):
 *   GET  /api/user/                  → handle_get_users
 *   GET  /api/user/user/:user_id     → handle_get_user
 *   POST /api/user/add               → handle_add_user
 *   POST /api/user/edit/:user_id     → handle_edit_user
 *
 * SECURITY GAP: No authentication or IAM middleware is applied to any of these
 * routes. POST /add and POST /edit/:user_id are fully unauthenticated — any
 * caller can create or modify users without a valid session.
 * Fix: apply authenticate middleware from server/middlewares/auth.middlewares.js
 * to all POST routes.
 *
 * All mutating operations use POST per the API convention.
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// ─── Mock S3 utilities before app import ─────────────────────────────────────
// Use an async factory that delegates to the shared s3.mock.js module so that
// the controller and the test file receive the SAME jest.fn() instances.
// A synchronous factory creates isolated instances that the controller never
// observes; the async-factory pattern threads the same mock objects through
// the entire module graph.

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

// ─── Deferred imports (after mock registration) ───────────────────────────────

let app;
let upload_file_to_s3, delete_file_from_s3, build_s3_key, clear_temp_files;

import request from 'supertest';
import bcrypt from 'bcrypt';
import { create_user } from '../helpers/factories.js';
import user_model from '../../models/user.model.js';
import { s3_mock, reset_s3_mocks } from '../mocks/s3.mock.js';

// Minimal valid 1×1 red pixel PNG (67 bytes, passes any MIME validator)
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Per-test payload builder — generates a unique email on every call so no two
// tests in the add-user suite share the same email address.
let _add_counter = 0;
const build_add_payload = () => {
  const n = ++_add_counter;
  return {
    user_name: `Dave New ${n}`,
    user_email: `dave.new.${n}@example.com`,
    user_password: 'SecurePass@99',
  };
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_user_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;

  // Use the shared s3_mock instances — these are the same objects the
  // controller's module graph receives when using the async factory pattern.
  upload_file_to_s3 = s3_mock.upload_file_to_s3;
  delete_file_from_s3 = s3_mock.delete_file_from_s3;
  build_s3_key = s3_mock.build_s3_key;
  clear_temp_files = s3_mock.clear_temp_files;
});

beforeEach(() => {
  // Reset call history on all S3 mock functions between tests.
  reset_s3_mocks();
});

// ─── GET /api/user ────────────────────────────────────────────────────────────

describe('GET /api/user — handle_get_users', () => {
  it('returns 200 with status success when users exist', async () => {
    await create_user({ user_name: 'Alice' });

    const res = await request(app).get('/api/user/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('returns 200 with an empty data array when no users exist', async () => {
    const res = await request(app).get('/api/user/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('data array contains user objects with user_name when users are seeded', async () => {
    const seeded = await create_user({ user_name: 'Bob Tester' });

    const res = await request(app).get('/api/user/');

    expect(res.status).toBe(200);
    const names = res.body.data.map((u) => u.user_name);
    expect(names).toContain(seeded.user_name);
  });
});

// ─── GET /api/user/user/:user_id ──────────────────────────────────────────────

describe('GET /api/user/user/:user_id — handle_get_user', () => {
  it('returns 200 and the user document for a valid existing user', async () => {
    const user = await create_user({ user_name: 'Carol' });

    const res = await request(app).get(`/api/user/user/${user._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data._id).toBe(user._id.toString());
    expect(res.body.data.user_name).toBe('Carol');
  });

  it('returns 404 for a valid ObjectId that has no matching document', async () => {
    const missing_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/user/user/${missing_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 500 for a malformed ObjectId that causes a Mongoose CastError', async () => {
    const res = await request(app).get('/api/user/user/not-an-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/user/add ───────────────────────────────────────────────────────

describe('POST /api/user/add — handle_add_user', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: route has no authenticate middleware', async () => {
    // Current behavior: 201 — the route accepts unauthenticated requests.
    // Fix: apply authenticate middleware to POST /add in user.route.js.
    const res = await request(app)
      .post('/api/user/add')
      .send(build_add_payload());

    expect(res.status).toBe(401);
  });

  it('returns 201 and status success with a valid body', async () => {
    const payload = build_add_payload();

    const res = await request(app)
      .post('/api/user/add')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.user_name).toBe(payload.user_name);
    expect(res.body.data.user_email).toBe(payload.user_email.toLowerCase());
  });

  it('returns 400 when user_name is missing', async () => {
    const { user_name: _omit, ...body } = build_add_payload();

    const res = await request(app).post('/api/user/add').send(body);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_name is a blank string', async () => {
    const res = await request(app)
      .post('/api/user/add')
      .send({ ...build_add_payload(), user_name: '' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_email is missing', async () => {
    const { user_email: _omit, ...body } = build_add_payload();

    const res = await request(app).post('/api/user/add').send(body);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_password is missing', async () => {
    const { user_password: _omit, ...body } = build_add_payload();

    const res = await request(app).post('/api/user/add').send(body);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 409 when user_email already exists (case-insensitive check)', async () => {
    // Seed with lowercase
    await create_user({ user_email: 'duplicate@example.com' });

    // Post with uppercase variant — the controller lowercases before the DB check
    const res = await request(app)
      .post('/api/user/add')
      .send({
        user_name: 'Dup User',
        user_email: 'DUPLICATE@EXAMPLE.COM',
        user_password: 'SomePass@1',
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('stores user_email as lowercase when posted with mixed case', async () => {
    const res = await request(app)
      .post('/api/user/add')
      .send({
        user_name: 'Eve Case',
        user_email: 'Eve.Case@EXAMPLE.COM',
        user_password: 'SecurePass@1',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user_email).toBe('eve.case@example.com');
  });

  it('stores a bcrypt hash for user_password — verified in DB and response body', async () => {
    const plaintext = 'PlaintextToHash@77';

    const res = await request(app)
      .post('/api/user/add')
      .send({
        user_name: 'Frank Hash',
        user_email: 'frank.hash@example.com',
        user_password: plaintext,
      });

    expect(res.status).toBe(201);

    // Response body must contain hash, never plaintext
    expect(res.body.data.user_password).toBeDefined();
    expect(res.body.data.user_password).not.toBe(plaintext);
    expect(res.body.data.user_password).toMatch(/^\$2b\$/);

    // Stored hash must round-trip correctly against the original plaintext
    const stored = await user_model.findById(res.body.data._id).lean();
    const matches = await bcrypt.compare(plaintext, stored.user_password);
    expect(matches).toBe(true);
    expect(stored.user_password).not.toBe(plaintext);
  });

  it('calls clear_temp_files with exactly one file entry whose fieldname is photo when validation fails', async () => {
    // Attach a photo but omit user_name to trigger the 400 validation path.
    // The controller uses upload.single('photo') which populates req.file (not req.files).
    // clear_temp_files must be called with [req.file] — an array of exactly one object
    // with fieldname 'photo'. If the route ever switches to upload.fields(), req.file
    // becomes undefined, clear_temp_files([]) is called instead, and this test fails.
    const res = await request(app)
      .post('/api/user/add')
      .attach('photo', PNG_BYTES, { filename: 'avatar.png', contentType: 'image/png' })
      .field('user_email', 'ghost@example.com')
      .field('user_password', 'SomePass@1');
    // user_name is intentionally omitted

    expect(res.status).toBe(400);
    expect(clear_temp_files).toHaveBeenCalledTimes(1);

    const [called_with] = clear_temp_files.mock.calls[0];
    expect(called_with).toHaveLength(1);
    expect(called_with[0]).toMatchObject({ fieldname: 'photo' });
  });

  it('calls build_s3_key and upload_file_to_s3 when a valid photo is attached', async () => {
    const res = await request(app)
      .post('/api/user/add')
      .attach('photo', PNG_BYTES, { filename: 'avatar.png', contentType: 'image/png' })
      .field('user_name', 'Grace Photo')
      .field('user_email', 'grace.photo@example.com')
      .field('user_password', 'SecurePass@1');

    expect(res.status).toBe(201);
    expect(build_s3_key).toHaveBeenCalledTimes(1);
    expect(upload_file_to_s3).toHaveBeenCalledTimes(1);
    expect(res.body.data.photo).toBeDefined();
    expect(res.body.data.photo.url).toBeTruthy();
  });

  it('does NOT call upload_file_to_s3 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/user/add')
      .send({
        user_name: 'Henry NoFile',
        user_email: 'henry.nofile@example.com',
        user_password: 'SecurePass@1',
      });

    expect(res.status).toBe(201);
    expect(upload_file_to_s3).not.toHaveBeenCalled();
  });
});

// ─── POST /api/user/edit/:user_id ─────────────────────────────────────────────

describe('POST /api/user/edit/:user_id — handle_edit_user', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: route has no authenticate middleware', async () => {
    // Current behavior: 200 — the route accepts unauthenticated requests.
    // Fix: apply authenticate middleware to POST /edit/:user_id in user.route.js.
    const user = await create_user();

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .send({ user_name: 'Unauthenticated Update' });

    expect(res.status).toBe(401);
  });

  it('returns 200 and status success when updating user_name on an existing user', async () => {
    const user = await create_user({ user_name: 'Old Name' });

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .send({ user_name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('response data.user_name reflects the updated value', async () => {
    const user = await create_user({ user_name: 'Before Update' });

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .send({ user_name: 'After Update' });

    expect(res.status).toBe(200);
    expect(res.body.data.user_name).toBe('After Update');
  });

  it('returns 404 when user_id is a valid ObjectId with no document', async () => {
    const missing_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/user/edit/${missing_id}`)
      .send({ user_name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 409 when the new user_email is already taken by a different user', async () => {
    const owner = await create_user({ user_email: 'owner@example.com' });
    const editor = await create_user({ user_email: 'editor@example.com' });

    const res = await request(app)
      .post(`/api/user/edit/${editor._id}`)
      .send({ user_email: 'owner@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('ignores blank user_name (sanitizePayload) — stored name is unchanged', async () => {
    const original_name = 'Immutable Name';
    const user = await create_user({ user_name: original_name });

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .send({ user_name: '' });

    expect(res.status).toBe(200);
    // sanitizePayload strips empty strings, so the name must stay unchanged
    expect(res.body.data.user_name).toBe(original_name);
  });

  it('re-hashes a new user_password and verifies the stored hash is correct', async () => {
    const user = await create_user();
    const new_password = 'NewSecurePass@99';

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .send({ user_password: new_password });

    expect(res.status).toBe(200);

    const stored = await user_model.findById(user._id).lean();
    const matches = await bcrypt.compare(new_password, stored.user_password);
    expect(matches).toBe(true);
    expect(stored.user_password).not.toBe(new_password);
  });

  it('uploads a new photo without calling delete_file_from_s3 when user has no prior photo', async () => {
    // create_user does not set photo, so photo.key will be absent
    const user = await create_user();

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .attach('photo', PNG_BYTES, { filename: 'new-avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(delete_file_from_s3).not.toHaveBeenCalled();
    expect(upload_file_to_s3).toHaveBeenCalledTimes(1);
    expect(res.body.data.photo).toBeDefined();
    expect(res.body.data.photo.url).toBeTruthy();
  });

  it('deletes the old photo key and uploads the replacement when user already has a photo', async () => {
    const old_key = 'users/some-id/photo/old-avatar.png';
    const user = await create_user();

    // Inject the prior photo directly into the DB so the controller sees it
    await user_model.findByIdAndUpdate(user._id, {
      $set: { photo: { url: 'https://old-bucket.example.com/old-avatar.png', key: old_key } },
    });

    const res = await request(app)
      .post(`/api/user/edit/${user._id}`)
      .attach('photo', PNG_BYTES, { filename: 'replacement.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(delete_file_from_s3).toHaveBeenCalledTimes(1);
    expect(delete_file_from_s3).toHaveBeenCalledWith(old_key);
    expect(upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('returns 500 for a malformed ObjectId that causes a Mongoose CastError', async () => {
    const res = await request(app)
      .post('/api/user/edit/not-an-id')
      .send({ user_name: 'Ghost' });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
