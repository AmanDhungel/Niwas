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
import contact_model from '../../models/contact.model.js';

// ─── PNG fixture ──────────────────────────────────────────────────────────────

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// ─── Contact factory ──────────────────────────────────────────────────────────
// The contact schema marks all address sub-fields as required.  Mongoose
// fires these sub-schema validators even when the top-level `address` key is
// absent, so every contact document must include a full address object.

let _contact_counter = 0;
const create_contact = async (overrides = {}) => {
  const n = ++_contact_counter;
  return contact_model.create({
    name: `Contact ${n}`,
    email: `contact.${n}@example.com`,
    phone: `+977-98000000${n.toString().padStart(2, '0')}`,
    address: {
      address: `${n} Test Street`,
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
  process.env.JWT_SECRET = 'test_jwt_secret_for_contact_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  reset_s3_mocks();
});

afterAll(() => {
  const temp_dir = fileURLToPath(new URL('../../../uploads/tmp/', import.meta.url));
  if (existsSync(temp_dir)) {
    rmSync(temp_dir, { recursive: true, force: true });
  }
});

// ─── GET /api/contact/ ────────────────────────────────────────────────────────

describe('GET /api/contact/', () => {
  it('returns 200 with an empty array when no contacts exist', async () => {
    const res = await request(app).get('/api/contact/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with an array containing the seeded contact', async () => {
    await create_contact({ name: 'Listed Contact' });

    const res = await request(app).get('/api/contact/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data[0].name).toBe('Listed Contact');
  });
});

// ─── GET /api/contact/:contact_id ─────────────────────────────────────────────

describe('GET /api/contact/:contact_id', () => {
  it('returns 200 with the correct document when contact exists', async () => {
    const contact = await create_contact({ name: 'Find Me' });

    const res = await request(app).get(`/api/contact/${contact._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data._id).toBe(contact._id.toString());
    expect(res.body.data.name).toBe('Find Me');
  });

  it('returns 200 with activity_log as an array (population check)', async () => {
    const contact = await create_contact();

    const res = await request(app).get(`/api/contact/${contact._id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.activity_log)).toBe(true);
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/contact/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).get('/api/contact/not-an-objectid');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/add ────────────────────────────────────────────────────

describe('POST /api/contact/add', () => {
  it('returns 201 with status success when admin sends valid name, email, phone', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'New Contact',
        email: 'new@example.com',
        phone: '+1-555-0001',
        address: JSON.stringify({ address: '1 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('returns data.name matching the sent name value', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Name Check',
        email: 'namecheck@example.com',
        phone: '+1-555-0002',
        address: JSON.stringify({ address: '2 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Name Check');
  });

  it('returns data.activity_log with one entry with action created', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Log Check',
        email: 'log@example.com',
        phone: '+1-555-0003',
        address: JSON.stringify({ address: '3 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.activity_log).toHaveLength(1);
    expect(res.body.data.activity_log[0].action).toBe('created');
  });

  it('returns 500 when name is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        email: 'noname@example.com',
        phone: '+1-555-0004',
        address: JSON.stringify({ address: '4 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when email is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'No Email',
        phone: '+1-555-0005',
        address: JSON.stringify({ address: '5 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when phone is missing because Mongoose ValidationError is caught', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'No Phone',
        email: 'nophone@example.com',
        address: JSON.stringify({ address: '6 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(regular)])
      .send({ name: 'Regular Attempt', email: 'reg@example.com', phone: '+1-555-0006' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(superuser)])
      .send({ name: 'Superuser Attempt', email: 'su@example.com', phone: '+1-555-0007' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(user_token, ...) is called bare with no guard.
    // When user_token is undefined (missing cookie), jwt.verify throws
    // JsonWebTokenError which propagates to the outer catch → 500.
    // Fix: guard user_token presence before verify, or wrap in try/catch returning 401.
    const res = await request(app)
      .post('/api/contact/add')
      .send({ name: 'No Cookie', email: 'nocookie@example.com', phone: '+1-555-0008' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 201 and data.tags contains both values when tags is JSON-stringified', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_auth_cookie(admin)])
      .send({
        name: 'Tagged Contact',
        email: 'tagged@example.com',
        phone: '+1-555-0009',
        tags: JSON.stringify(['VIP', 'Lead']),
        address: JSON.stringify({ address: '7 Main St', country: 'US', state: 'CA', city: 'SF', zip_code: '94102' }),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toContain('VIP');
    expect(res.body.data.tags).toContain('Lead');
  });

  it('returns 401 when cookie contains a tampered JWT signed with the wrong secret', async () => {
    // Controller gap: jwt.verify throws JsonWebTokenError for a bad signature →
    // outer catch → 500. Fix: catch JsonWebTokenError / TokenExpiredError → 401.
    const res = await request(app)
      .post('/api/contact/add')
      .set('Cookie', [get_invalid_token_cookie()])
      .send({ name: 'Tampered', email: 'tampered@example.com', phone: '+1-555-0099' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/edit/:contact_id ───────────────────────────────────────

describe('POST /api/contact/edit/:contact_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_contact has no authentication guard', async () => {
    // Controller gap: handle_edit_contact reads no cookie, calls no jwt.verify,
    // and checks no user_type. Any unauthenticated caller can modify any contact.
    // Fix: add the JWT + admin check used in handle_add_contact (controller lines 91–105).
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/edit/${contact._id}`)
      .send({ name: 'Unauthenticated Edit' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.name reflects the updated value', async () => {
    const contact = await create_contact({ name: 'Before Edit' });

    const res = await request(app)
      .post(`/api/contact/edit/${contact._id}`)
      .send({ name: 'After Edit' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('After Edit');
  });

  it('returns 200 and data.phone reflects the updated phone value', async () => {
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/edit/${contact._id}`)
      .send({ phone: '+1-555-9999' });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('+1-555-9999');
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/edit/${unknown_id}`)
      .send({ name: 'Ghost Edit' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not overwrite existing name when a blank name is sent (sanitizePayload strips it)', async () => {
    const contact = await create_contact({ name: 'Original Name' });

    const res = await request(app)
      .post(`/api/contact/edit/${contact._id}`)
      .send({ name: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Original Name');
  });
});

// ─── POST /api/contact/delete/:contact_id ─────────────────────────────────────

describe('POST /api/contact/delete/:contact_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_contact has no authentication guard', async () => {
    // Controller gap: handle_delete_contact has no auth. Any unauthenticated caller
    // can permanently delete any contact record.
    // Fix: add the JWT + admin check at the top of handle_delete_contact.
    const contact = await create_contact();

    const res = await request(app).post(`/api/contact/delete/${contact._id}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with message Contact deleted successfully', async () => {
    const contact = await create_contact();

    const res = await request(app).post(`/api/contact/delete/${contact._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Contact deleted successfully');
  });

  it('contact is actually removed from the database after deletion', async () => {
    const contact = await create_contact();

    await request(app).post(`/api/contact/delete/${contact._id}`);

    const found = await contact_model.findById(contact._id);
    expect(found).toBeNull();
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(`/api/contact/delete/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/notes/add ─────────────────────────────────

describe('POST /api/contact/:contact_id/notes/add', () => {
  it('returns 201 with status success when admin posts a note to an existing contact', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Note Title')
      .field('note', 'Note body text');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('returns data.title and data.note matching the sent values', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'My Title')
      .field('note', 'My Note');

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My Title');
    expect(res.body.data.note).toBe('My Note');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Denied');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(undefined) throws JsonWebTokenError → outer catch → 500.
    // Fix: guard user_token presence, or catch JsonWebTokenError explicitly → 401.
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .field('title', 'No Cookie');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the contact does not exist', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Ghost Contact');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('calls upload_file_to_s3 once when one attachment file is uploaded', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'With Attachment')
      .attach('attachments', PNG_BYTES, { filename: 'note.png', contentType: 'image/png' });

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('calls clear_temp_files when auth fails with a file attached', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Auth Fail With File')
      .attach('attachments', PNG_BYTES, { filename: 'denied.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(s3_mock.clear_temp_files).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/add`)
      .set('Cookie', [get_auth_cookie(superuser)])
      .field('title', 'Superuser Note Attempt');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/notes/edit/:note_id ───────────────────────

describe('POST /api/contact/:contact_id/notes/edit/:note_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_note_on_contact has no authentication guard', async () => {
    // Controller gap: handle_edit_note_on_contact reads no cookie and checks no
    // user_type. Any unauthenticated caller can modify notes and their S3 attachments.
    // Fix: add the JWT + admin check at the top of handle_edit_note_on_contact.
    const contact = await create_contact();
    contact.notes.push({ title: 'Existing Note', note: 'body' });
    await contact.save();
    const note_id = contact.notes[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/edit/${note_id}`)
      .field('title', 'Unauthenticated Edit');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.title reflects the updated value', async () => {
    const contact = await create_contact();
    contact.notes.push({ title: 'Old Title', note: 'Old note' });
    await contact.save();
    const note_id = contact.notes[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/edit/${note_id}`)
      .field('title', 'New Title');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.title).toBe('New Title');
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_contact_id}/notes/edit/${unknown_note_id}`)
      .field('title', 'Ghost Note');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the note_id does not exist on the contact', async () => {
    const contact = await create_contact();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/notes/edit/${unknown_note_id}`)
      .field('title', 'No Such Note');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('calls delete_file_from_s3 for an attachment removed via existing_attachments filtering', async () => {
    const contact = await create_contact();
    contact.notes.push({
      title: 'Has Attachment',
      note: 'body',
      attachments: [{ file: 'https://bucket/old.png', key: 'contact/old-key/old.png' }],
    });
    await contact.save();
    const note_id = contact.notes[0]._id;

    await request(app)
      .post(`/api/contact/${contact._id}/notes/edit/${note_id}`)
      .field('existing_attachments', JSON.stringify([]));

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(1);
  });

  it('calls upload_file_to_s3 when a new attachment file is added during edit', async () => {
    const contact = await create_contact();
    contact.notes.push({ title: 'Edit Upload', note: 'body' });
    await contact.save();
    const note_id = contact.notes[0]._id;

    await request(app)
      .post(`/api/contact/${contact._id}/notes/edit/${note_id}`)
      .attach('attachments', PNG_BYTES, { filename: 'new-attach.png', contentType: 'image/png' });

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });
});

// ─── POST /api/contact/:contact_id/notes/delete/:note_id ─────────────────────

describe('POST /api/contact/:contact_id/notes/delete/:note_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_note_from_contact has no authentication guard', async () => {
    // Controller gap: handle_delete_note_from_contact has no auth. Any unauthenticated
    // caller can delete notes and trigger S3 deletions for their attachments.
    // Fix: add the JWT + admin check at the top of handle_delete_note_from_contact.
    const contact = await create_contact();
    contact.notes.push({ title: 'Protected Note', note: 'body' });
    await contact.save();
    const note_id = contact.notes[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/notes/delete/${note_id}`
    );

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and the contact re-fetched from DB has an empty notes array', async () => {
    const contact = await create_contact();
    contact.notes.push({ title: 'To Delete', note: 'will be gone' });
    await contact.save();
    const note_id = contact.notes[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/notes/delete/${note_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const refetched = await contact_model.findById(contact._id);
    expect(refetched.notes).toHaveLength(0);
  });

  it('calls delete_file_from_s3 once per attachment on the deleted note', async () => {
    const contact = await create_contact();
    contact.notes.push({
      title: 'With Files',
      note: 'body',
      attachments: [
        { file: 'https://bucket/a.png', key: 'contact/key-a/a.png' },
        { file: 'https://bucket/b.png', key: 'contact/key-b/b.png' },
      ],
    });
    await contact.save();
    const note_id = contact.notes[0]._id;

    await request(app).post(
      `/api/contact/${contact._id}/notes/delete/${note_id}`
    );

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(2);
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${unknown_contact_id}/notes/delete/${unknown_note_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the note_id does not match any note on the contact', async () => {
    const contact = await create_contact();
    const unknown_note_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${contact._id}/notes/delete/${unknown_note_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/call_log/add ───────────────────────────────

describe('POST /api/contact/:contact_id/call_log/add', () => {
  it('returns 201 with status success when admin posts a call log to an existing contact', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'connected' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('returns data.status matching the sent value', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'busy' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('busy');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(undefined) throws JsonWebTokenError → outer catch → 500.
    // Fix: guard user_token presence, or catch JsonWebTokenError explicitly → 401.
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/add`)
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the contact does not exist', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ status: 'no_answer' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/add`)
      .set('Cookie', [get_auth_cookie(superuser)])
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/call_log/edit/:call_log_id ────────────────

describe('POST /api/contact/:contact_id/call_log/edit/:call_log_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_call_log_on_contact has no authentication guard', async () => {
    // Controller gap: handle_edit_call_log_on_contact has no auth. Any unauthenticated
    // caller can modify any call log on any contact.
    // Fix: add the JWT + admin check at the top of handle_edit_call_log_on_contact.
    const contact = await create_contact();
    contact.calls.push({ status: 'busy', note: 'initial' });
    await contact.save();
    const call_log_id = contact.calls[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/edit/${call_log_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.status reflects the updated value', async () => {
    const contact = await create_contact();
    contact.calls.push({ status: 'busy', note: 'initial' });
    await contact.save();
    const call_log_id = contact.calls[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/edit/${call_log_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('connected');
  });

  it('returns 200 and data.note reflects the updated note field', async () => {
    const contact = await create_contact();
    contact.calls.push({ status: 'connected', note: 'old note' });
    await contact.save();
    const call_log_id = contact.calls[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/edit/${call_log_id}`)
      .send({ note: 'updated note' });

    expect(res.status).toBe(200);
    expect(res.body.data.note).toBe('updated note');
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_contact_id}/call_log/edit/${unknown_call_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the call_log_id does not match any call log on the contact', async () => {
    const contact = await create_contact();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/call_log/edit/${unknown_call_id}`)
      .send({ status: 'connected' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/call_log/delete/:call_log_id ──────────────

describe('POST /api/contact/:contact_id/call_log/delete/:call_log_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_call_log_from_contact has no authentication guard', async () => {
    // Controller gap: handle_delete_call_log_from_contact has no auth. Any unauthenticated
    // caller can delete any call log from any contact.
    // Fix: add the JWT + admin check at the top of handle_delete_call_log_from_contact.
    const contact = await create_contact();
    contact.calls.push({ status: 'connected', note: 'to be protected' });
    await contact.save();
    const call_log_id = contact.calls[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/call_log/delete/${call_log_id}`
    );

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and the contact re-fetched from DB has an empty calls array', async () => {
    const contact = await create_contact();
    contact.calls.push({ status: 'connected', note: 'to be deleted' });
    await contact.save();
    const call_log_id = contact.calls[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/call_log/delete/${call_log_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const refetched = await contact_model.findById(contact._id);
    expect(refetched.calls).toHaveLength(0);
  });

  it('returns 200 even when the call_log_id does not exist because filter silently no-ops', async () => {
    const contact = await create_contact();
    const nonexistent_call_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${contact._id}/call_log/delete/${nonexistent_call_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_call_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${unknown_contact_id}/call_log/delete/${unknown_call_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/files/add ─────────────────────────────────

describe('POST /api/contact/:contact_id/files/add', () => {
  it('returns 201 with status success when admin adds a file to an existing contact', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ title: 'Contract Draft' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('returns data.title matching the sent title value', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ title: 'Title Check' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Title Check');
  });

  it('returns data.status defaulting to active when status is not sent', async () => {
    const admin = await create_admin_user();
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ title: 'Default Status' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .set('Cookie', [get_auth_cookie(regular)])
      .send({ title: 'Denied File' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: jwt.verify(undefined) throws JsonWebTokenError → outer catch → 500.
    // Fix: guard user_token presence, or catch JsonWebTokenError explicitly → 401.
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .send({ title: 'No Cookie File' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the contact does not exist', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_id}/files/add`)
      .set('Cookie', [get_auth_cookie(admin)])
      .send({ title: 'Ghost File' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is superuser', async () => {
    const superuser = await create_user({ user_type: 'superuser' });
    const contact = await create_contact();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/add`)
      .set('Cookie', [get_auth_cookie(superuser)])
      .send({ title: 'Superuser File Attempt' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/files/edit/:file_id ───────────────────────

describe('POST /api/contact/:contact_id/files/edit/:file_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_edit_file_on_contact has no authentication guard', async () => {
    // Controller gap: handle_edit_file_on_contact reads no cookie and checks no
    // user_type. Any unauthenticated caller can modify any file entry on any contact.
    // Fix: add the JWT + admin check at the top of handle_edit_file_on_contact.
    const contact = await create_contact();
    contact.files.push({ title: 'Protected File', status: 'active', signature: 'no_signature' });
    await contact.save();
    const file_id = contact.files[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/edit/${file_id}`)
      .send({ title: 'Unauthenticated Edit' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and data.title reflects the updated value', async () => {
    const contact = await create_contact();
    contact.files.push({ title: 'Old File Title', status: 'active', signature: 'no_signature' });
    await contact.save();
    const file_id = contact.files[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/edit/${file_id}`)
      .send({ title: 'Updated File Title' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.title).toBe('Updated File Title');
  });

  it('returns 200 and data.status reflects the updated status field', async () => {
    const contact = await create_contact();
    contact.files.push({ title: 'Status File', status: 'active', signature: 'no_signature' });
    await contact.save();
    const file_id = contact.files[0]._id;

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/edit/${file_id}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_file_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${unknown_contact_id}/files/edit/${unknown_file_id}`)
      .send({ title: 'Ghost File Edit' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the file_id does not match any file on the contact', async () => {
    const contact = await create_contact();
    const unknown_file_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/contact/${contact._id}/files/edit/${unknown_file_id}`)
      .send({ title: 'No Such File' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/contact/:contact_id/files/delete/:file_id ─────────────────────

describe('POST /api/contact/:contact_id/files/delete/:file_id', () => {
  it('returns 401 when no auth cookie is provided — SECURITY GAP: handle_delete_file_from_contact has no authentication guard', async () => {
    // Controller gap: handle_delete_file_from_contact has no auth. Any unauthenticated
    // caller can delete any file entry from any contact.
    // Fix: add the JWT + admin check at the top of handle_delete_file_from_contact.
    const contact = await create_contact();
    contact.files.push({ title: 'Protected File', status: 'active', signature: 'no_signature' });
    await contact.save();
    const file_id = contact.files[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/files/delete/${file_id}`
    );

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and the contact re-fetched from DB has an empty files array', async () => {
    const contact = await create_contact();
    contact.files.push({ title: 'To Delete', status: 'active', signature: 'no_signature' });
    await contact.save();
    const file_id = contact.files[0]._id;

    const res = await request(app).post(
      `/api/contact/${contact._id}/files/delete/${file_id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const refetched = await contact_model.findById(contact._id);
    expect(refetched.files).toHaveLength(0);
  });

  it('returns 404 when the contact does not exist', async () => {
    const unknown_contact_id = new mongoose.Types.ObjectId();
    const unknown_file_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${unknown_contact_id}/files/delete/${unknown_file_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the file_id does not match any file on the contact', async () => {
    const contact = await create_contact();
    const unknown_file_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(
      `/api/contact/${contact._id}/files/delete/${unknown_file_id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
