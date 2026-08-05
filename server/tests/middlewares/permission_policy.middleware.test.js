/**
 * tests/middlewares/permission_policy.middleware.test.js
 *
 * Comprehensive integration test suite for the `check_permission_policy`
 * middleware factory defined in:
 *   server/middlewares/permission_policy.middleware.js
 *
 * Strategy
 * ────────
 * Because `check_permission_policy` is a middleware — not a standalone
 * controller — every scenario is exercised by mounting a minimal Express
 * application that contains exactly the middleware chain under test:
 *
 *   cookie-parser  →  check_permission_policy(options)  →  200 sentinel
 *
 * `authenticate` is intentionally NOT included in most test chains.
 * `check_permission_policy` reads `req.cookies.user_token` itself via its
 * internal `resolve_user_id` helper, making it fully self-contained.
 *
 * The real Mongoose models and the in-memory MongoDB server (configured in
 * tests/setup.js) are used throughout. Nothing at the database layer is
 * mocked — only the S3 utility is mocked because some controller imports
 * in the wider app would otherwise attempt live bucket calls.
 *
 * Data isolation
 * ──────────────
 * The global `beforeEach` in tests/setup.js calls `db.clearAll()` before
 * every test, so each `it` block starts with an empty database and creates
 * only the documents it needs.
 */

import { jest } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import check_permission_policy from '../../middlewares/permission_policy.middleware.js';
import {
  create_user,
  create_superuser,
  create_inactive_user,
  create_user_with_policy,
  create_user_with_group_policy,
  create_permission_policy,
  create_permission_group,
} from '../helpers/factories.js';
import {
  get_auth_cookie,
  get_regular_user_cookie,
  get_superuser_cookie,
  get_invalid_token_cookie,
  get_empty_cookie,
} from '../helpers/auth.helper.js';

// ─── Test environment setup ───────────────────────────────────────────────────

beforeAll(() => {
  // Ensure JWT_SECRET is set for token signing/verification throughout
  // this suite. Mirrors the value used in auth.helper.js sign_token().
  process.env.JWT_SECRET = 'test_jwt_secret_for_infrastructure_tests';
});

// ─── Minimal app factory ──────────────────────────────────────────────────────

/**
 * Build a minimal Express app that protects a single GET /test route with
 * `check_permission_policy(options)`.
 *
 * The sentinel handler responds with `{ ok: true }` so tests can assert
 * that the middleware called `next()`.
 *
 * @param {Object} permission_options  Passed directly to check_permission_policy.
 * @returns {import('express').Express}
 */
const build_test_app = (permission_options) => {
  const app = express();
  app.use(cookieParser());
  app.get(
    '/test',
    check_permission_policy(permission_options),
    (_req, res) => res.json({ ok: true }),
  );
  return app;
};

// ─── 1. Missing / invalid authentication ─────────────────────────────────────

describe('Authentication — missing or invalid user_token cookie', () => {
  let app;

  beforeAll(() => {
    // A real policy; the auth check fires before any policy lookup.
    app = build_test_app({ policies: 'invoice:view' });
  });

  it('returns 401 when no cookie is sent at all', async () => {
    const response = await request(app).get('/test').expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Unauthenticated. Please log in.',
    });
  });

  it('returns 401 when the user_token cookie is empty', async () => {
    const response = await request(app)
      .get('/test')
      .set('Cookie', [get_empty_cookie()])
      .expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Unauthenticated. Please log in.',
    });
  });

  it('returns 401 when the JWT is signed with the wrong secret', async () => {
    const response = await request(app)
      .get('/test')
      .set('Cookie', [get_invalid_token_cookie()])
      .expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Unauthenticated. Please log in.',
    });
  });

  it('returns 500 when jwt.verify throws an unexpected non-JWT error', async () => {
    // GAP: resolve_user_id catches ALL errors and returns null → 401.
    // A transient infrastructure failure (not a JWT error) should surface as 500,
    // not silently become "Unauthenticated". The current catch block is too broad.
    const verify_spy = jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
      throw new Error('Unexpected infrastructure failure');
    });

    try {
      const response = await request(app)
        .get('/test')
        .set('Cookie', ['user_token=any_non_empty_token'])
        // current impl: catch swallows the error → returns null → 401
        // correct impl: catch re-throws non-JWT errors → outer catch → 500
        .expect(500);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Permission check failed.',
      });
    } finally {
      verify_spy.mockRestore();
    }
  });

  it('returns 401 when the user referenced by the JWT does not exist in the database', async () => {
    // Create a real token, then clear the DB so the user record is gone.
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);

    // setup.js clears the DB before every test, so the user no longer exists.
    // We need to verify this specific scenario explicitly by creating a user,
    // getting a cookie, then deleting the user record from the DB.
    const user_model = (await import('../../models/user.model.js')).default;
    await user_model.findByIdAndDelete(user._id);

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'User not found or inactive.',
    });
  });

  it('returns 401 for an inactive user', async () => {
    const user = await create_inactive_user();
    const cookie = get_auth_cookie(user);

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'User not found or inactive.',
    });
  });

  it('returns 401 for a soft-deleted user', async () => {
    const user = await create_user({ is_deleted: true });
    const cookie = get_auth_cookie(user);

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(401);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'User not found or inactive.',
    });
  });
});

// ─── 2. Superuser bypass ──────────────────────────────────────────────────────

describe('Superuser bypass', () => {
  it('passes a superuser through without checking any policies', async () => {
    const user = await create_superuser();
    const cookie = get_superuser_cookie(user);
    const app = build_test_app({ policies: 'invoice:view' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('passes a superuser even when the requested policy does not exist', async () => {
    const user = await create_superuser();
    const cookie = get_superuser_cookie(user);
    const app = build_test_app({ policies: 'nonexistent:policy:that:does:not:exist' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('passes a superuser when multiple impossible policies are required with mode all', async () => {
    const user = await create_superuser();
    const cookie = get_superuser_cookie(user);
    const app = build_test_app({
      policies: ['ghost:read', 'ghost:write', 'ghost:delete'],
      mode: 'all',
    });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });
});

// ─── 3. mode: "any" (default) ─────────────────────────────────────────────────

describe('mode: "any" — pass if at least one policy is granted', () => {
  it('grants access when the user has the single required policy (direct allow)', async () => {
    const { user } = await create_user_with_policy('invoice:view', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'invoice:view' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('denies access when the user has no matching policies', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'invoice:view' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Access denied.',
    });
    expect(response.body.reason).toContain('None of the required policies are granted');
    // Assert the full bracket-formatted policy name so format changes are caught.
    expect(response.body.reason).toContain('[invoice:view]');
  });

  it('grants access when the user has one of several listed policies', async () => {
    // User only has "invoice:edit" but either "invoice:view" or "invoice:edit" is sufficient.
    const { user } = await create_user_with_policy('invoice:edit', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['invoice:view', 'invoice:edit'] });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('denies access when the user has none of several listed policies', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['invoice:view', 'invoice:edit', 'invoice:create'] });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('None of the required policies are granted');
    expect(response.body.reason).toContain('invoice:view');
    expect(response.body.reason).toContain('invoice:edit');
    expect(response.body.reason).toContain('invoice:create');
  });

  it('uses "any" as the default mode when mode is omitted', async () => {
    // Providing two policies with no mode — first one granted should pass.
    const { user } = await create_user_with_policy('payroll:view', 'allow');
    const cookie = get_regular_user_cookie(user);

    // No explicit mode key — defaults to "any"
    const app = build_test_app({ policies: ['payroll:view', 'payroll:edit'] });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('grants access via a group-level allow policy under mode any', async () => {
    const { user } = await create_user_with_group_policy('hrm:view', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'hrm:view' });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });
});

// ─── 4. mode: "all" ───────────────────────────────────────────────────────────

describe('mode: "all" — every policy must be granted', () => {
  it('grants access when the user holds every required policy', async () => {
    // Attach two allow policies directly to the user.
    const policy_a = await create_permission_policy('report:read', 'allow');
    const policy_b = await create_permission_policy('report:export', 'allow');
    const user = await create_user({
      user_permission_policies: [policy_a._id, policy_b._id],
    });
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['report:read', 'report:export'], mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('denies access when the user is missing even one required policy', async () => {
    // User only has "report:read"; "report:export" is absent.
    const { user } = await create_user_with_policy('report:read', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['report:read', 'report:export'], mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Access denied.',
    });
    // The reason should mention the missing policy.
    expect(response.body.reason).toContain('report:export');
  });

  it('denies access when the user has none of the required policies', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['finance:read', 'finance:write'], mode: 'all' });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);
  });

  it('denies access when one policy is allowed but another is explicitly denied', async () => {
    const allow_policy = await create_permission_policy('asset:view', 'allow');
    const deny_policy = await create_permission_policy('asset:delete', 'deny');
    const user = await create_user({
      user_permission_policies: [allow_policy._id, deny_policy._id],
    });
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['asset:view', 'asset:delete'], mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('asset:delete');
  });
});

// ─── 5. Priority / override rules ─────────────────────────────────────────────

describe('Priority rules — user-level overrides group-level', () => {
  it('user-level DENY overrides a group-level ALLOW → 403', async () => {
    // The group grants "billing:view" but the user has it explicitly denied.
    const user = await create_user();
    const group_allow = await create_permission_policy('billing:view', 'allow');
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_allow._id],
    });
    const user_deny = await create_permission_policy('billing:view', 'deny');
    // Attach the deny policy directly to the user.
    user.user_permission_policies = [user_deny._id];
    await user.save();

    const cookie = get_regular_user_cookie(user);

    // Use mode: "all" so the per-policy reason string is surfaced in the response.
    const app = build_test_app({ policies: 'billing:view', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    // mode:"all" returns the specific evaluate_one reason for the failing policy.
    expect(response.body.reason).toContain('explicitly denied at user level');
  });

  it('user-level ALLOW overrides a group-level DENY → 200', async () => {
    // The group denies "billing:edit" but the user has it explicitly allowed.
    const user = await create_user();
    const group_deny = await create_permission_policy('billing:edit', 'deny');
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_deny._id],
    });
    const user_allow = await create_permission_policy('billing:edit', 'allow');
    user.user_permission_policies = [user_allow._id];
    await user.save();

    const cookie = get_regular_user_cookie(user);

    // Works with the default mode:"any" — user allow beats group deny so the policy resolves granted.
    const app = build_test_app({ policies: 'billing:edit' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('user-level DENY is final even when user also has an ALLOW for the same policy', async () => {
    // A user document has both allow and deny for the same policy key.
    // The deny entry should win because user_denies check runs first in evaluate_one.
    const allow_policy = await create_permission_policy('dual:policy', 'allow');
    const deny_policy = await create_permission_policy('dual:policy', 'deny');
    const user = await create_user({
      user_permission_policies: [allow_policy._id, deny_policy._id],
    });
    const cookie = get_regular_user_cookie(user);

    // Use mode:"all" to get the fine-grained per-policy reason in the response body.
    const app = build_test_app({ policies: 'dual:policy', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    // The per-policy reason is exposed when mode is "all".
    expect(response.body.reason).toContain('explicitly denied at user level');
  });

  it('returns 403 when the user has no policies assigned at any level', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);

    // Use mode:"all" to get the fine-grained per-policy reason.
    const app = build_test_app({ policies: 'crm:view', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    // evaluate_one returns "Policy ... is not assigned" when nothing matches.
    expect(response.body.reason).toContain('not assigned');
  });

  it('group-level DENY denies when no user-level override exists', async () => {
    const { user } = await create_user_with_group_policy('expense:delete', 'deny');
    const cookie = get_regular_user_cookie(user);

    // Use mode:"all" so the fine-grained per-policy deny reason is returned.
    const app = build_test_app({ policies: 'expense:delete', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('explicitly denied at group level');
  });

  it('group-level ALLOW grants when no user-level override exists', async () => {
    const { user } = await create_user_with_group_policy('expense:view', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'expense:view' });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });
});

// ─── 6. source option ─────────────────────────────────────────────────────────

describe('source: "direct" — only user-level policies are checked', () => {
  it('grants access when the user has a direct allow and the group also allows', async () => {
    const user_allow = await create_permission_policy('hr:view', 'allow');
    const group_allow = await create_permission_policy('hr:view', 'allow');
    const user = await create_user({ user_permission_policies: [user_allow._id] });
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_allow._id],
    });
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'hr:view', source: 'direct' });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('denies access when the policy is only in the group, not directly on the user', async () => {
    // Group has the allow but source:"direct" means group is ignored.
    const { user } = await create_user_with_group_policy('hr:edit', 'allow');
    const cookie = get_regular_user_cookie(user);

    // mode:"all" surfaces the per-policy reason from evaluate_one.
    const app = build_test_app({ policies: 'hr:edit', source: 'direct', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    // "not assigned" because the group is zeroed out and user has no direct entry.
    expect(response.body.reason).toContain('not assigned');
  });

  it('respects user-level DENY even under source direct', async () => {
    const { user } = await create_user_with_policy('hr:delete', 'deny');
    const cookie = get_regular_user_cookie(user);

    // mode:"all" surfaces the per-policy reason from evaluate_one.
    const app = build_test_app({ policies: 'hr:delete', source: 'direct', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('explicitly denied at user level');
  });
});

describe('source: "group" — only group-level policies are checked', () => {
  it('grants access when the group allows the policy (user has no direct entry)', async () => {
    const { user } = await create_user_with_group_policy('payroll:run', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'payroll:run', source: 'group' });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('denies access when the policy is only direct on the user, not in any group', async () => {
    // User has a direct allow, but source:"group" means direct is zeroed out.
    const { user } = await create_user_with_policy('payroll:edit', 'allow');
    const cookie = get_regular_user_cookie(user);

    // mode:"all" surfaces the per-policy reason from evaluate_one.
    const app = build_test_app({ policies: 'payroll:edit', source: 'group', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('not assigned');
  });

  it('denies access when the group denies the policy', async () => {
    const { user } = await create_user_with_group_policy('payroll:delete', 'deny');
    const cookie = get_regular_user_cookie(user);

    // mode:"all" surfaces the per-policy reason from evaluate_one.
    const app = build_test_app({ policies: 'payroll:delete', source: 'group', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('explicitly denied at group level');
  });

  it('ignores user-level ALLOW under source group — only group-level is evaluated', async () => {
    // User has direct allow but group denies; source:"group" means only group counts.
    const user = await create_user();
    const group_deny = await create_permission_policy('finance:export', 'deny');
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_deny._id],
    });
    const user_allow = await create_permission_policy('finance:export', 'allow');
    user.user_permission_policies = [user_allow._id];
    await user.save();

    const cookie = get_regular_user_cookie(user);

    // mode:"all" so the fine-grained group-deny reason is surfaced.
    // With source:"group", the user allow is zeroed out, leaving only the group deny.
    const app = build_test_app({ policies: 'finance:export', source: 'group', mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('explicitly denied at group level');
  });
});

// ─── 7. Response shape validation ─────────────────────────────────────────────

describe('Response shape', () => {
  it('successful pass-through returns the downstream handler response', async () => {
    const { user } = await create_user_with_policy('test:shape', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'test:shape' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toStrictEqual({ ok: true });
  });

  it('403 response always includes status, message, and reason fields', async () => {
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'shape:check' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Access denied.');
    expect(response.body).toHaveProperty('reason');
    expect(typeof response.body.reason).toBe('string');
  });

  it('401 response always includes status and message fields', async () => {
    const app = build_test_app({ policies: 'shape:check' });

    const response = await request(app).get('/test').expect(401);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });
});

// ─── 8. Multiple policies edge cases ──────────────────────────────────────────

describe('Edge cases — policy arrays and mixed results', () => {
  it('mode any: grants when only the last policy in the list is allowed', async () => {
    const { user } = await create_user_with_policy('c:policy', 'allow');
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: ['a:policy', 'b:policy', 'c:policy'] });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('mode all: grants access when policies come from both direct and group levels', async () => {
    const direct_policy = await create_permission_policy('compound:direct', 'allow');
    const group_policy = await create_permission_policy('compound:group', 'allow');
    const user = await create_user({ user_permission_policies: [direct_policy._id] });
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_policy._id],
    });
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({
      policies: ['compound:direct', 'compound:group'],
      mode: 'all',
    });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('passing a single policy as a string is equivalent to an array of one', async () => {
    const { user } = await create_user_with_policy('single:policy', 'allow');
    const cookie = get_regular_user_cookie(user);

    const string_app = build_test_app({ policies: 'single:policy' });
    const array_app = build_test_app({ policies: ['single:policy'] });

    const [string_res, array_res] = await Promise.all([
      request(string_app).get('/test').set('Cookie', [cookie]),
      request(array_app).get('/test').set('Cookie', [cookie]),
    ]);

    expect(string_res.status).toBe(200);
    expect(array_res.status).toBe(200);
  });

  it('user belonging to multiple groups gets policies from all groups', async () => {
    const user = await create_user();

    const policy_a = await create_permission_policy('multi:group:a', 'allow');
    const policy_b = await create_permission_policy('multi:group:b', 'allow');

    await create_permission_group({
      users: [user._id],
      permission_policies: [policy_a._id],
    });
    await create_permission_group({
      users: [user._id],
      permission_policies: [policy_b._id],
    });

    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({
      policies: ['multi:group:a', 'multi:group:b'],
      mode: 'all',
    });

    await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);
  });
});

// ─── 9. Priority boundary: user-DENY + group-ALLOW under mode: "any" ─────────

describe('Priority / override rules — mode: "any" variant', () => {
  it('user-level DENY overrides group-level ALLOW → 403 under mode: "any"', async () => {
    const user = await create_user();
    const group_allow = await create_permission_policy('billing:view', 'allow');
    await create_permission_group({
      users: [user._id],
      permission_policies: [group_allow._id],
    });
    const user_deny = await create_permission_policy('billing:view', 'deny');
    user.user_permission_policies = [user_deny._id];
    await user.save();

    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: 'billing:view' }); // default mode: "any"

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('None of the required policies are granted');
    expect(response.body.reason).toContain('billing:view');
  });
});

// ─── 10. Invalid mode value ───────────────────────────────────────────────────

describe('mode validation', () => {
  it('returns 400 for an unrecognized mode value', async () => {
    const { user } = await create_user_with_policy('x:policy', 'allow');
    const app = build_test_app({ policies: 'x:policy', mode: 'both' });
    const cookie = get_regular_user_cookie(user);

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(400);

    // Middleware returns: `Invalid mode "both". Use "any" or "all".`
    expect(response.body.message).toContain('Invalid mode');
  });
});

// ─── 11. Empty policies array ─────────────────────────────────────────────────

describe('Empty policies array boundary behavior', () => {
  it('mode: "any" with policies: [] returns 403 with a programmer-error reason — empty list is a configuration mistake', async () => {
    // GAP: An empty policy list means no policy can ever be checked — this is a
    // programmer error, not a legitimate authorization failure. The middleware
    // should detect it and return a distinct reason ("No policies specified.")
    // rather than the vacuous "None of the required policies are granted: []"
    // which falls through the normal deny path silently.
    const user = await create_user();
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: [], mode: 'any' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Access denied.',
    });
    // current impl returns "None of the required policies are granted: []" — GAP
    expect(response.body.reason).toBe('No policies specified.');
  });

  it('empty policies array passes all checks under mode: "all" (known allow-all behavior)', async () => {
    // policy_list is [] → results is [] → find(r => !r.granted) is undefined → next() is called
    // This is a known allow-all edge case: mode:"all" with zero required policies always passes.
    const user = await create_user(); // no policies at all
    const cookie = get_regular_user_cookie(user);
    const app = build_test_app({ policies: [], mode: 'all' });

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });
});

// ─── 12. Two groups with conflicting decisions on the same policy ─────────────

describe('Conflicting group-level policies', () => {
  it('group-level DENY beats group-level ALLOW when user belongs to two conflicting groups', async () => {
    // Group A allows conflict:policy; Group B denies it.
    // In evaluate_one, group_denies is checked before group_allows → DENY wins.
    const user = await create_user();
    const allow_policy = await create_permission_policy('conflict:policy', 'allow');
    const deny_policy = await create_permission_policy('conflict:policy', 'deny');

    await create_permission_group({ users: [user._id], permission_policies: [allow_policy._id] });
    await create_permission_group({ users: [user._id], permission_policies: [deny_policy._id] });

    const app = build_test_app({ policies: 'conflict:policy', mode: 'all' });
    const cookie = get_regular_user_cookie(user);

    const response = await request(app)
      .get('/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.reason).toContain('explicitly denied at group level');
    expect(response.body.reason).toContain('conflict:policy');
  });
});
