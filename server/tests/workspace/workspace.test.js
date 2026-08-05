import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { rmSync, existsSync } from 'fs';
import { resolve } from 'path';

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

let app;

import request from 'supertest';
import {
  create_user,
  create_admin_user,
  create_domain_workspace,
  create_vendor_workspace,
} from '../helpers/factories.js';
import { get_auth_cookie } from '../helpers/auth.helper.js';
import { s3_mock, reset_s3_mocks } from '../mocks/s3.mock.js';
import domain_workspace_model from '../../models/workspace/domain_workspace.model.js';
import vendor_workspace_model from '../../models/workspace/vendor_workspace.model.js';

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_workspace_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  reset_s3_mocks();
});

// ─── Domain Workspace — Create ────────────────────────────────────────────────

describe('POST /api/workspace/create_domain_workspace', () => {
  it('returns 201 with the created workspace when admin user sends a valid title', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Alpha Workspace');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.title).toBe('Alpha Workspace');
  });

  it('returns 400 when title field is absent', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .field('visibility', 'public');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when title is a blank string', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', '   ');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user_type is regular', async () => {
    const regular = await create_user({ user_type: 'regular' });

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Not Allowed');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('You are not authorized to perform this action.');
  });

  it('calls clear_temp_files once when a file is attached and the user is not admin', async () => {
    const regular = await create_user({ user_type: 'regular' });

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(regular)])
      .attach('image_file', PNG_BYTES, { filename: 'denied.png', contentType: 'image/png' })
      .field('title', 'Denied With File');

    expect(res.status).toBe(401);
    expect(s3_mock.clear_temp_files).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when user_type is superuser because superusers do not pass the admin check', async () => {
    const superuser = await create_user({ user_type: 'superuser' });

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(superuser)])
      .field('title', 'Superuser Attempt');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('You are not authorized to perform this action.');
  });

  it('returns 401 when no cookie is provided', async () => {
    // Controller gap: get_admin_user() calls jwt.verify(user_token, ...) with no
    // try/catch. When user_token is undefined (missing cookie), jwt.verify throws
    // JsonWebTokenError which propagates to the handler's outer catch → 500.
    // Fix: wrap jwt.verify in get_admin_user() with its own try/catch and return
    // 401 on JsonWebTokenError / TokenExpiredError.
    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .field('title', 'No Cookie');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('calls upload_file_to_s3 once when only image_file is attached', async () => {
    const admin = await create_admin_user();

    await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .attach('image_file', PNG_BYTES, { filename: 'ws.png', contentType: 'image/png' })
      .field('title', 'With Image');

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('calls upload_file_to_s3 twice when both image_file and icon_file are attached', async () => {
    const admin = await create_admin_user();

    await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .attach('image_file', PNG_BYTES, { filename: 'ws.png', contentType: 'image/png' })
      .attach('icon_file', PNG_BYTES, { filename: 'icon.png', contentType: 'image/png' })
      .field('title', 'With Both Files');

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(2);
  });

  it('does not call upload_file_to_s3 when no files are attached', async () => {
    const admin = await create_admin_user();

    await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'No Files');

    expect(s3_mock.upload_file_to_s3).not.toHaveBeenCalled();
  });

  it('returns data.image set to the uploaded URL when image_file is attached', async () => {
    const admin = await create_admin_user();

    const res = await request(app)
      .post('/api/workspace/create_domain_workspace')
      .set('Cookie', [get_auth_cookie(admin)])
      .attach('image_file', PNG_BYTES, { filename: 'ws.png', contentType: 'image/png' })
      .field('title', 'Image URL Check');

    expect(res.status).toBe(201);
    expect(res.body.data.image).toMatch(
      /^https:\/\/test-bucket\.test-region\.digitaloceanspaces\.com\/workspace\/.+/
    );
  });
});

// ─── Domain Workspace — Edit ──────────────────────────────────────────────────

describe('POST /api/workspace/edit_domain_workspace/:domain_workspace_id', () => {
  it('returns 200 with status success and data.title reflecting the updated value', async () => {
    const admin = await create_admin_user();
    const workspace = await create_domain_workspace({ title: 'Before' });

    const res = await request(app)
      .post(`/api/workspace/edit_domain_workspace/${workspace._id}`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'After');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.title).toBe('After');
  });

  it('returns 404 when the domain_workspace_id is a valid ObjectId with no matching document', async () => {
    const admin = await create_admin_user();
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/workspace/edit_domain_workspace/${unknown_id}`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Ghost Edit');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user is not admin', async () => {
    const regular = await create_user({ user_type: 'regular' });
    const workspace = await create_domain_workspace({ title: 'Exists' });

    const res = await request(app)
      .post(`/api/workspace/edit_domain_workspace/${workspace._id}`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Unauthorized Edit');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when user is not admin and the workspace does not exist', async () => {
    // Controller gap: handle_edit_domain_workspace runs findById BEFORE the admin
    // check. A non-admin requesting a non-existent workspace ID receives 404,
    // revealing whether the resource exists. A non-admin should always receive 401
    // regardless of whether the workspace ID is valid.
    // Fix: move get_admin_user() / 401 check before the findById call.
    const regular = await create_user({ user_type: 'regular' });
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/workspace/edit_domain_workspace/${unknown_id}`)
      .set('Cookie', [get_auth_cookie(regular)])
      .field('title', 'Probe Attempt');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('calls delete_file_from_s3 and upload_file_to_s3 when image_file is replaced', async () => {
    const admin = await create_admin_user();
    const workspace = await create_domain_workspace({
      title: 'Has Image',
      image: 'https://bucket/old.png',
      image_key: 'workspace/old-key/old.png',
    });

    await request(app)
      .post(`/api/workspace/edit_domain_workspace/${workspace._id}`)
      .set('Cookie', [get_auth_cookie(admin)])
      .attach('image_file', PNG_BYTES, { filename: 'new.png', contentType: 'image/png' });

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(1);
    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });

  it('does not call upload_file_to_s3 or delete_file_from_s3 when no files are attached', async () => {
    const admin = await create_admin_user();
    const workspace = await create_domain_workspace({ title: 'No File Edit' });

    await request(app)
      .post(`/api/workspace/edit_domain_workspace/${workspace._id}`)
      .set('Cookie', [get_auth_cookie(admin)])
      .field('title', 'Still No File');

    expect(s3_mock.upload_file_to_s3).not.toHaveBeenCalled();
    expect(s3_mock.delete_file_from_s3).not.toHaveBeenCalled();
  });
});

// ─── Domain Workspace — Get All ───────────────────────────────────────────────

describe('GET /api/workspace/', () => {
  it('returns 200 with an empty array when no workspaces exist', async () => {
    const res = await request(app).get('/api/workspace/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with an array containing the seeded workspace', async () => {
    await create_domain_workspace({ title: 'Listed Workspace' });

    const res = await request(app).get('/api/workspace/');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Listed Workspace');
  });
});

// ─── Domain Workspace — Get One ───────────────────────────────────────────────

describe('GET /api/workspace/domain/:domain_workspace_id', () => {
  it('returns 200 with the correct document when workspace exists', async () => {
    const workspace = await create_domain_workspace({ title: 'Find Me' });

    const res = await request(app).get(`/api/workspace/domain/${workspace._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data._id).toBe(workspace._id.toString());
    expect(res.body.data.title).toBe('Find Me');
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/workspace/domain/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── Domain Workspace — Assign Users ─────────────────────────────────────────

describe('POST /api/workspace/update_assigned_users/domain_workspace/:domain_workspace_id', () => {
  it('returns 200 and stores the assigned user IDs', async () => {
    const workspace = await create_domain_workspace({ title: 'Assignable' });
    const user = await create_user();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.assigned_users).toContain(user._id.toString());
  });

  it('returns 400 when assigned_users parses to a non-array value', async () => {
    const workspace = await create_domain_workspace({ title: 'Bad Payload' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({ assigned_users: JSON.stringify('not-an-array') });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Assigned users must be an array of user IDs.');
  });

  it('returns 400 when assigned_users field is omitted from the body entirely', async () => {
    // Controller gap: JSON.parse(req.body.assigned_users) is called unconditionally.
    // When assigned_users is absent, req.body.assigned_users is undefined and
    // JSON.parse(undefined) throws a SyntaxError caught by the outer catch → 500.
    // Fix: guard the field before parsing:
    //   if (typeof req.body.assigned_users !== 'string') return res.status(400)...
    const workspace = await create_domain_workspace({ title: 'Missing Field Domain' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when one or more user IDs do not exist in the database', async () => {
    const workspace = await create_domain_workspace({ title: 'Ghost Users' });
    const nonexistent_id = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({ assigned_users: JSON.stringify([nonexistent_id]) });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('One or more user IDs are invalid.');
  });

  it('returns 404 when the domain workspace does not exist', async () => {
    const unknown_id = new mongoose.Types.ObjectId();
    const user = await create_user();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${unknown_id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('stores each valid user exactly once when two distinct users are assigned', async () => {
    const workspace = await create_domain_workspace({ title: 'Dedup Domain' });
    const user_a = await create_user();
    const user_b = await create_user();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({
        assigned_users: JSON.stringify([
          user_a._id.toString(),
          user_b._id.toString(),
        ]),
      });

    expect(res.status).toBe(200);
    const ids = res.body.data.assigned_users.map(String);
    expect(ids).toContain(user_a._id.toString());
    expect(ids).toContain(user_b._id.toString());
    expect(ids).toHaveLength(2);
  });

  it('returns 200 with an empty assigned_users array when sent an empty array', async () => {
    const workspace = await create_domain_workspace({ title: 'Empty Assign Domain' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({ assigned_users: JSON.stringify([]) });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.assigned_users)).toBe(true);
    expect(res.body.data.assigned_users).toHaveLength(0);
  });

  it('does not duplicate a user who is already in assigned_users when sent again', async () => {
    // Controller gap: workspace.assigned_users contains Mongoose ObjectId instances;
    // parsed_assigned_users contains plain strings. Spreading both into a Set uses
    // reference equality for objects — ObjectId("abc") and the string "abc" are
    // treated as different values, so the Set fails to deduplicate and the stored
    // array contains two entries for the same user.
    // Fix: normalize both arrays to strings before the Set:
    //   [...new Set([...(workspace.assigned_users || []).map(String), ...parsed_assigned_users])]
    const workspace = await create_domain_workspace({ title: 'Dedup Existing Domain' });
    const user = await create_user();

    await domain_workspace_model.findByIdAndUpdate(workspace._id, {
      $set: { assigned_users: [user._id] },
    });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/domain_workspace/${workspace._id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(200);
    // Assert directly on the response — do NOT re-apply Set here, which would mask
    // duplicates the controller stored.
    expect(res.body.data.assigned_users).toHaveLength(1);
    expect(res.body.data.assigned_users.map(String)).toContain(user._id.toString());
  });
});

// ─── Vendor Workspace — Create ────────────────────────────────────────────────

describe('POST /api/workspace/create_vendor_workspace', () => {
  it('returns 201 with the created vendor workspace when name and domain are valid', async () => {
    const domain = await create_domain_workspace({ title: 'Parent Domain' });

    const res = await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .field('name', 'Vendor One')
      .field('domain', domain._id.toString());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Vendor One');
  });

  it('returns 400 when name is missing', async () => {
    const domain = await create_domain_workspace({ title: 'Some Domain' });

    const res = await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .field('domain', domain._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when domain is missing', async () => {
    const res = await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .field('name', 'No Domain Vendor');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the domain workspace does not exist', async () => {
    const unknown_domain_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .field('name', 'Orphan Vendor')
      .field('domain', unknown_domain_id.toString());

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 201 for an unauthenticated request with a valid body because no auth is required', async () => {
    const domain = await create_domain_workspace({ title: 'Open Domain' });

    const res = await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .field('name', 'No Auth Vendor')
      .field('domain', domain._id.toString());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('calls upload_file_to_s3 once when logo_file is attached', async () => {
    const domain = await create_domain_workspace({ title: 'Logo Domain' });

    await request(app)
      .post('/api/workspace/create_vendor_workspace')
      .attach('logo_file', PNG_BYTES, { filename: 'logo.png', contentType: 'image/png' })
      .field('name', 'Logo Vendor')
      .field('domain', domain._id.toString());

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });
});

// ─── Vendor Workspace — Edit ──────────────────────────────────────────────────

describe('POST /api/workspace/edit_vendor_workspace/:vendor_workspace_id', () => {
  it('returns 200 and updates the name', async () => {
    const domain = await create_domain_workspace({ title: 'Edit Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Before Edit' });

    const res = await request(app)
      .post(`/api/workspace/edit_vendor_workspace/${vendor._id}`)
      .field('name', 'After Edit');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('After Edit');
  });

  it('returns 200 and updates label_color and visibility', async () => {
    const domain = await create_domain_workspace({ title: 'Color Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Style Vendor' });

    const res = await request(app)
      .post(`/api/workspace/edit_vendor_workspace/${vendor._id}`)
      .send({ label_color: '#ff0000', visibility: 'public' });

    expect(res.status).toBe(200);
    expect(res.body.data.label_color).toBe('#ff0000');
    expect(res.body.data.visibility).toBe('public');
  });

  it('returns 404 when the vendor workspace does not exist', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/workspace/edit_vendor_workspace/${unknown_id}`)
      .field('name', 'Ghost');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('calls delete_file_from_s3 and upload_file_to_s3 when logo_file is replaced', async () => {
    const domain = await create_domain_workspace({ title: 'Logo Replace Domain' });
    const vendor = await create_vendor_workspace(domain._id, {
      name: 'Has Logo',
      logo: 'https://bucket/old-logo.png',
      logo_key: 'workspace/domain-id/vendor/old-logo.png',
    });

    await request(app)
      .post(`/api/workspace/edit_vendor_workspace/${vendor._id}`)
      .attach('logo_file', PNG_BYTES, { filename: 'new-logo.png', contentType: 'image/png' });

    expect(s3_mock.delete_file_from_s3).toHaveBeenCalledTimes(1);
    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
  });
});

// ─── Vendor Workspace — Get for Domain ───────────────────────────────────────

describe('GET /api/workspace/vendor_workspaces/:domain_workspace_id', () => {
  it('returns 200 with an array of vendor workspaces belonging to the domain', async () => {
    const domain = await create_domain_workspace({ title: 'Has Vendors' });
    await create_vendor_workspace(domain._id, { name: 'Vendor A' });
    await create_vendor_workspace(domain._id, { name: 'Vendor B' });

    const res = await request(app).get(`/api/workspace/vendor_workspaces/${domain._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with an empty array when no vendor workspaces exist under the domain', async () => {
    const domain = await create_domain_workspace({ title: 'No Vendors' });

    const res = await request(app).get(`/api/workspace/vendor_workspaces/${domain._id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });
});

// ─── Vendor Workspace — Get One ───────────────────────────────────────────────

describe('GET /api/workspace/vendor_workspace/:vendor_workspace_id', () => {
  it('returns 200 with the correct vendor workspace document', async () => {
    const domain = await create_domain_workspace({ title: 'Source Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Find Vendor' });

    const res = await request(app).get(`/api/workspace/vendor_workspace/${vendor._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data._id).toBe(vendor._id.toString());
    expect(res.body.data.name).toBe('Find Vendor');
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/workspace/vendor_workspace/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── Vendor Workspace — Assign Users ─────────────────────────────────────────

describe('POST /api/workspace/update_assigned_users/vendor_workspace/:vendor_workspace_id', () => {
  it('returns 200 and stores the assigned user IDs', async () => {
    const domain = await create_domain_workspace({ title: 'Assign Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Assign Vendor' });
    const user = await create_user();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.assigned_users).toContain(user._id.toString());
  });

  it('returns 400 when assigned_users parses to a non-array value', async () => {
    const domain = await create_domain_workspace({ title: 'Non Array Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Non Array Vendor' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({ assigned_users: JSON.stringify('not-an-array') });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Assigned users must be an array of user IDs.');
  });

  it('returns 400 when assigned_users field is omitted from the body entirely', async () => {
    // Controller gap: JSON.parse(req.body.assigned_users) is called unconditionally.
    // When assigned_users is absent, req.body.assigned_users is undefined and
    // JSON.parse(undefined) throws a SyntaxError caught by the outer catch → 500.
    // Fix: guard the field before parsing:
    //   if (typeof req.body.assigned_users !== 'string') return res.status(400)...
    const domain = await create_domain_workspace({ title: 'Missing Field Vendor Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Missing Field Vendor' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when one or more user IDs do not exist in the database', async () => {
    const domain = await create_domain_workspace({ title: 'Ghost Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Ghost Vendor' });
    const nonexistent_id = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({ assigned_users: JSON.stringify([nonexistent_id]) });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('One or more user IDs are invalid.');
  });

  it('returns 404 when the vendor workspace does not exist', async () => {
    const unknown_id = new mongoose.Types.ObjectId();
    const user = await create_user();

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${unknown_id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with an empty assigned_users array when sent an empty array', async () => {
    const domain = await create_domain_workspace({ title: 'Empty Vendor Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Empty Assign Vendor' });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({ assigned_users: JSON.stringify([]) });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.assigned_users)).toBe(true);
    expect(res.body.data.assigned_users).toHaveLength(0);
  });

  it('does not duplicate a user who is already in assigned_users when sent again', async () => {
    // Controller gap: workspace.assigned_users contains Mongoose ObjectId instances;
    // parsed_assigned_users contains plain strings. Spreading both into a Set uses
    // reference equality for objects — ObjectId("abc") and the string "abc" are
    // treated as different values, so the Set fails to deduplicate and the stored
    // array contains two entries for the same user.
    // Fix: normalize both arrays to strings before the Set:
    //   [...new Set([...(workspace.assigned_users || []).map(String), ...parsed_assigned_users])]
    const domain = await create_domain_workspace({ title: 'Dedup Vendor Domain' });
    const vendor = await create_vendor_workspace(domain._id, { name: 'Dedup Existing Vendor' });
    const user = await create_user();

    await vendor_workspace_model.findByIdAndUpdate(vendor._id, {
      $set: { assigned_users: [user._id] },
    });

    const res = await request(app)
      .post(`/api/workspace/update_assigned_users/vendor_workspace/${vendor._id}`)
      .send({ assigned_users: JSON.stringify([user._id.toString()]) });

    expect(res.status).toBe(200);
    // Assert directly on the response — do NOT re-apply Set here, which would mask
    // duplicates the controller stored.
    expect(res.body.data.assigned_users).toHaveLength(1);
    expect(res.body.data.assigned_users.map(String)).toContain(user._id.toString());
  });
});

// ─── Cleanup ──────────────────────────────────────────────────────────────────

afterAll(() => {
  const temp_dir = resolve('../uploads/temporary/user/');
  if (existsSync(temp_dir)) {
    rmSync(temp_dir, { recursive: true, force: true });
  }
});
