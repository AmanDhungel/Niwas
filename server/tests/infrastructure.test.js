/**
 * tests/infrastructure.test.js
 *
 * Smoke tests for the global test infrastructure.
 *
 * These tests verify that the four foundational files are wired together
 * correctly before any domain-specific tests are written.  They do not
 * test application behaviour — they test the test harness itself.
 */

import mongoose from 'mongoose';
import { db } from './setup.js';
import {
  create_user,
  create_superuser,
  create_inactive_user,
  create_domain_workspace,
  create_vendor_workspace,
  create_permission_policy,
  create_permission_group,
  create_user_with_policy,
  create_user_with_group_policy,
  TEST_PASSWORD,
} from './helpers/factories.js';
import {
  get_auth_cookie,
  get_regular_user_cookie,
  get_superuser_cookie,
  get_invalid_token_cookie,
  get_empty_cookie,
} from './helpers/auth.helper.js';
import { s3_mock, reset_s3_mocks } from './mocks/s3.mock.js';
import jwt from 'jsonwebtoken';

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(() => {
  // JWT_SECRET must be set for auth.helper to sign tokens.
  process.env.JWT_SECRET = 'test_jwt_secret_for_infrastructure_tests';
});

beforeEach(() => {
  reset_s3_mocks();
});

// ─── setup.js ─────────────────────────────────────────────────────────────────

describe('setup.js — in-memory database', () => {
  it('connects Mongoose to the in-memory server', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('db.clear() removes documents from the named collection', async () => {
    await create_user();
    await create_user();

    const before = await mongoose.connection.collections['users'].countDocuments();
    expect(before).toBeGreaterThanOrEqual(2);

    await db.clear('users');

    const after = await mongoose.connection.collections['users'].countDocuments();
    expect(after).toBe(0);
  });

  it('db.clearAll() empties every collection', async () => {
    await create_user();
    await create_domain_workspace();

    await db.clearAll();

    // Assert collections exist before counting — the ?. ?? 0 workaround would
    // silently pass (returning 0) even for a misspelled or missing collection name.
    expect(mongoose.connection.collections['users']).toBeDefined();
    expect(mongoose.connection.collections['domain_workspaces']).toBeDefined();

    const user_count = await mongoose.connection.collections['users'].countDocuments();
    const ws_count = await mongoose.connection.collections['domain_workspaces'].countDocuments();

    expect(user_count).toBe(0);
    expect(ws_count).toBe(0);
  });
});

// ─── factories.js ─────────────────────────────────────────────────────────────

describe('factories.js — create_user()', () => {
  it('creates a regular user with the correct defaults', async () => {
    const user = await create_user();

    expect(user._id).toBeDefined();
    expect(user.user_type).toBe('regular');
    expect(user.is_active).toBe(true);
    expect(user.is_deleted).toBe(false);
    expect(user.user_email_verified).toBe(true);
  });

  it('generates a unique email on each call', async () => {
    const a = await create_user();
    const b = await create_user();

    expect(a.user_email).not.toBe(b.user_email);
    expect(a._id.toString()).not.toBe(b._id.toString());
  });

  it('accepts field overrides', async () => {
    const user = await create_user({ user_name: 'Override Name' });
    expect(user.user_name).toBe('Override Name');
  });

  it('exports a known plaintext TEST_PASSWORD constant', () => {
    expect(typeof TEST_PASSWORD).toBe('string');
    expect(TEST_PASSWORD.length).toBeGreaterThan(0);
  });
});

describe('factories.js — create_superuser()', () => {
  it('creates a user with user_type superuser', async () => {
    const user = await create_superuser();
    expect(user.user_type).toBe('superuser');
  });
});

describe('factories.js — create_inactive_user()', () => {
  it('creates a user with is_active false', async () => {
    const user = await create_inactive_user();
    expect(user.is_active).toBe(false);
  });
});

describe('factories.js — workspace factories', () => {
  it('create_domain_workspace() persists a workspace', async () => {
    const ws = await create_domain_workspace({ title: 'My WS' });

    expect(ws._id).toBeDefined();
    expect(ws.title).toBe('My WS');
  });

  it('create_vendor_workspace() links to the domain workspace', async () => {
    const domain = await create_domain_workspace();
    const vendor = await create_vendor_workspace(domain._id);

    expect(vendor._id).toBeDefined();
    expect(vendor.domain.toString()).toBe(domain._id.toString());
  });
});

describe('factories.js — IAM factories', () => {
  it('create_permission_policy() creates an allow policy', async () => {
    const policy = await create_permission_policy('invoice:view');

    expect(policy.policy).toBe('invoice:view');
    expect(policy.type).toBe('allow');
  });

  it('create_permission_policy() creates a deny policy', async () => {
    const policy = await create_permission_policy('invoice:delete', 'deny');
    expect(policy.type).toBe('deny');
  });

  it('create_permission_group() persists a group', async () => {
    const group = await create_permission_group({ name: 'Admins' });
    expect(group._id).toBeDefined();
    expect(group.name).toBe('Admins');
  });

  it('create_user_with_policy() attaches policy directly to user', async () => {
    const { user, policy } = await create_user_with_policy('invoice:create');

    // objectContaining({ _id: objectContaining({}) }) is vacuous — any ObjectId
    // instance satisfies objectContaining({}) regardless of its actual value.
    // Use a direct string comparison so a wrong or missing policy ID is caught.
    expect(user.user_permission_policies).toHaveLength(1);
    expect(user.user_permission_policies[0].toString()).toBe(policy._id.toString());
  });

  it('create_user_with_group_policy() wires user through a group', async () => {
    const { user, group } = await create_user_with_group_policy('payroll:view');

    const user_ids = group.users.map((id) => id.toString());
    expect(user_ids).toContain(user._id.toString());
  });
});

// ─── auth.helper.js ───────────────────────────────────────────────────────────

describe('auth.helper.js', () => {
  it('get_auth_cookie() returns a cookie string with a valid JWT', () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(user);

    expect(cookie).toMatch(/^user_token=/);
    const token = cookie.replace('user_token=', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.user_id).toBe(user._id.toString());
  });

  it('get_regular_user_cookie() returns a valid cookie string', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);

    expect(cookie).toMatch(/^user_token=/);
  });

  it('get_superuser_cookie() returns a cookie for the superuser', async () => {
    const user = await create_superuser();
    const cookie = get_superuser_cookie(user);
    const token = cookie.replace('user_token=', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.user_id).toBe(user._id.toString());
  });

  it('get_invalid_token_cookie() produces a token that fails jwt.verify', () => {
    const cookie = get_invalid_token_cookie();
    const token = cookie.replace('user_token=', '');

    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
  });

  it('get_empty_cookie() returns a cookie with no token value', () => {
    const cookie = get_empty_cookie();
    expect(cookie).toBe('user_token=');
  });
});

// ─── s3.mock.js ───────────────────────────────────────────────────────────────

describe('s3.mock.js', () => {
  it('upload_file_to_s3 resolves with { key, url }', async () => {
    const fake_file = { path: '/tmp/test.png', mimetype: 'image/png' };
    const result = await s3_mock.upload_file_to_s3(fake_file, 'workspace/id/test.png');

    expect(result).toEqual({
      key: 'workspace/id/test.png',
      url: expect.stringContaining('workspace/id/test.png'),
    });
  });

  it('delete_file_from_s3 resolves without throwing', async () => {
    await expect(s3_mock.delete_file_from_s3('workspace/id/test.png')).resolves.toBeUndefined();
  });

  it('build_s3_key joins non-empty parts with forward slashes', () => {
    expect(s3_mock.build_s3_key('workspace', 'abc123', 'vendor/xyz', 'logo.png'))
      .toBe('workspace/abc123/vendor/xyz/logo.png');

    expect(s3_mock.build_s3_key('workspace', 'abc123', '', 'logo.png'))
      .toBe('workspace/abc123/logo.png');
  });

  it('clear_temp_files is a no-op mock function', () => {
    expect(() => s3_mock.clear_temp_files({ image: [{ path: '/tmp/x' }] })).not.toThrow();
  });

  it('reset_s3_mocks() clears call history', async () => {
    await s3_mock.upload_file_to_s3({ path: '/tmp/f' }, 'key');
    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);

    reset_s3_mocks();

    expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(0);
  });
});
