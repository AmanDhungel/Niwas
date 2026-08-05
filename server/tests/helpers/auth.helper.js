/**
 * tests/helpers/auth.helper.js
 *
 * Authentication helpers for integration tests.
 *
 * Design goals:
 *   - Generate real JWTs using the exact same payload structure and
 *     secret that the production `authenticate` middleware and
 *     `check_permission_policy` middleware verify.  Nothing is mocked —
 *     these tokens must pass the real middleware stack.
 *   - Provide factory functions for the three meaningful user states:
 *       create_regular_user_cookie  — a normal, active user
 *       create_superuser_cookie     — bypasses all permission checks
 *       create_inactive_user_cookie — triggers the "inactive" 401 path
 *   - Return a fully-formed cookie string so callers can write:
 *       .set('Cookie', [await create_regular_user_cookie(user)])
 *
 * JWT payload structure (mirrors auth.controllers.js → handle_signin):
 *   { user_id: <ObjectId string>, remember: <boolean> }
 *
 * The `authenticate` middleware (auth.middlewares.js) does:
 *   1. Read `req.cookies.user_token`
 *   2. jwt.verify(user_token, process.env.JWT_SECRET)  → extracts user_id
 *   3. user_model.findById(user_id)                    → must return a live document
 *
 * Therefore the user MUST already exist in the in-memory database when
 * a token is generated here.  Use the factories in factories.js to
 * create the user first, then pass the document to these helpers.
 *
 * Usage:
 *
 *   import { create_user } from './factories.js';
 *   import { get_auth_cookie } from './auth.helper.js';
 *
 *   const user = await create_user();
 *   const cookie = get_auth_cookie(user);
 *
 *   const response = await request(app)
 *     .get('/api/something')
 *     .set('Cookie', [cookie]);
 */

import jwt from 'jsonwebtoken';

// ─── Internal token builder ──────────────────────────────────────────────────

/**
 * Sign a JWT with the production secret using the canonical payload
 * shape.  No expiry is set by default so tests never fail due to
 * time-based token expiry when running on a slow CI machine.
 *
 * @param {import('mongoose').Document} user  A persisted Mongoose user document.
 * @param {Object} [overrides]  Optional payload overrides for edge-case tests.
 * @returns {string}  A signed JWT string.
 */
const sign_token = (user, overrides = {}) => {
  const payload = {
    user_id: user._id.toString(),
    remember: false,
    ...overrides,
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

// ─── Cookie string builder ────────────────────────────────────────────────────

/**
 * Build the `user_token=<jwt>` cookie string that Supertest sends via
 * `.set('Cookie', [...])`.  The value mirrors what the browser would
 * store after a successful sign-in (httpOnly; no path attribute needed
 * for server-side Supertest requests).
 *
 * @param {import('mongoose').Document} user  A persisted Mongoose user document.
 * @param {Object} [token_overrides]  Optional JWT payload overrides.
 * @returns {string}  Ready-to-use cookie string, e.g. "user_token=eyJ..."
 */
export const get_auth_cookie = (user, token_overrides = {}) => {
  const token = sign_token(user, token_overrides);
  return `user_token=${token}`;
};

// ─── Role-aware convenience helpers ──────────────────────────────────────────

/**
 * Return an auth cookie for a standard active regular user.
 *
 * The `authenticate` middleware will find this user in the DB and attach
 * them to `req.user`.  The `check_permission_policy` middleware will
 * look up their permission policies normally (none by default).
 *
 * @param {import('mongoose').Document} user  A persisted user document
 *   (user_type: 'regular', is_active: true, is_deleted: false).
 * @returns {string}  Cookie string.
 */
export const get_regular_user_cookie = (user) => {
  return get_auth_cookie(user);
};

/**
 * Return an auth cookie for a superuser.
 *
 * The `check_permission_policy` middleware short-circuits for superusers
 * (user_type === 'superuser') and calls next() immediately without
 * evaluating any policies.  This is the cookie to use when testing
 * "admin can always do this" happy paths.
 *
 * The user document itself must already have user_type: 'superuser'
 * stored in the database.  Use create_superuser() from factories.js.
 *
 * @param {import('mongoose').Document} user  A persisted superuser document.
 * @returns {string}  Cookie string.
 */
export const get_superuser_cookie = (user) => {
  return get_auth_cookie(user);
};

/**
 * Return a cookie whose JWT references a valid user_id but the user
 * has is_active: false.  This exercises the inactive-user 401 branch
 * inside `check_permission_policy`.
 *
 * The user document must already be persisted with is_active: false.
 *
 * @param {import('mongoose').Document} user  A persisted inactive user document.
 * @returns {string}  Cookie string.
 */
export const get_inactive_user_cookie = (user) => {
  return get_auth_cookie(user);
};

/**
 * Return a cookie containing a JWT signed with an unknown secret,
 * simulating a tampered or expired token.  The `authenticate`
 * middleware will reject this with a 401.
 *
 * @returns {string}  Cookie string with an invalid token.
 */
export const get_invalid_token_cookie = () => {
  const fake_token = jwt.sign({ user_id: 'fake_id' }, 'WRONG_SECRET');
  return `user_token=${fake_token}`;
};

/**
 * Return a cookie string with an empty value, simulating a missing or
 * cleared token.  The `authenticate` middleware returns 401 when
 * user_token is absent or empty.
 *
 * @returns {string}  Cookie string with no token value.
 */
export const get_empty_cookie = () => {
  return 'user_token=';
};
