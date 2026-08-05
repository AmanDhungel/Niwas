/**
 * tests/helpers/factories.js
 *
 * Test data factories for core Mongoose models.
 *
 * Design goals:
 *   - Insert real documents into the in-memory database so that all
 *     middleware (authenticate, check_permission_policy) can look them
 *     up normally.  Nothing is stubbed at the database level.
 *   - Accept optional overrides so individual tests can customise only
 *     the fields they care about without repeating boilerplate.
 *   - Never rely on hardcoded _id values or shared mutable state.
 *     Every call returns a freshly-inserted document with a unique _id.
 *   - Keep passwords hashed so the user document is realistic (bcrypt
 *     hash of a known plaintext password).
 *
 * Expanding this file:
 *   Add a new factory when you need to test a new domain.  Follow the
 *   same pattern: a plain-object `defaults_*` builder + an async
 *   `create_*` function that persists the document and returns it.
 *
 * Usage:
 *
 *   import { create_user, create_superuser, create_domain_workspace } from './factories.js';
 *
 *   const user      = await create_user();
 *   const superuser = await create_superuser();
 *   const workspace = await create_domain_workspace({ assigned_users: [user._id] });
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import user_model from '../../models/user.model.js';
import domain_workspace_model from '../../models/workspace/domain_workspace.model.js';
import vendor_workspace_model from '../../models/workspace/vendor_workspace.model.js';
import permission_policy_model from '../../models/iam/permission_policy.model.js';
import permission_group_model from '../../models/iam/permission_group.model.js';
import department_model from '../../models/hrm/department.model.js';
import designation_model from '../../models/hrm/designation.model.js';
import company_model from '../../models/company.model.js';
import employee_model from '../../models/employee.model.js';
import attendance_model from '../../models/hrm/attendance/attendance.model.js';

// ─── Counters ─────────────────────────────────────────────────────────────────
// Simple in-process counters guarantee unique values (email addresses,
// names) within a single test run without reaching for a UUID library.

let _user_counter = 0;
let _workspace_counter = 0;
let _vendor_counter = 0;
let _policy_counter = 0;
let _group_counter = 0;
let _department_counter = 0;
let _designation_counter = 0;
let _company_counter = 0;
let _employee_counter = 0;
let _attendance_counter = 0;

const next_user = () => ++_user_counter;
const next_workspace = () => ++_workspace_counter;
const next_vendor = () => ++_vendor_counter;
const next_policy = () => ++_policy_counter;
const next_group = () => ++_group_counter;
const next_department = () => ++_department_counter;
const next_designation = () => ++_designation_counter;
const next_company = () => ++_company_counter;
const next_employee = () => ++_employee_counter;
const next_attendance = () => ++_attendance_counter;

// ─── Shared hashed password ───────────────────────────────────────────────────
// Pre-compute once.  Tests that need to sign in programmatically can
// use the plaintext constant `TEST_PASSWORD`.
//
// Use a single salt round in test environments so bcrypt does not slow
// down the test suite.  Production-like cost (10) is preserved elsewhere.

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 10;

export const TEST_PASSWORD = 'Test@Password123';
let _hashed_password = null;

const get_hashed_password = async () => {
  if (!_hashed_password) {
    _hashed_password = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
  }
  return _hashed_password;
};

// ─── User factory ─────────────────────────────────────────────────────────────

/**
 * Build a plain-object user payload with sensible defaults.
 * Accepts partial overrides.
 *
 * @param {Object} [overrides]
 * @returns {Promise<Object>}
 */
const build_user_data = async (overrides = {}) => {
  const n = next_user();
  return {
    user_name: `Test User ${n}`,
    user_email: `test.user.${n}@example.com`,
    user_password: await get_hashed_password(),
    user_email_verified: true,
    user_type: 'regular',
    is_active: true,
    is_deleted: false,
    ...overrides,
  };
};

/**
 * Create and persist a regular user in the in-memory database.
 *
 * The returned document has `user_type: 'regular'` and no permission
 * policies attached.  It will pass the `authenticate` middleware but
 * will be denied by any `check_permission_policy` guard unless you
 * add policies to it via `create_permission_policy` + assignment.
 *
 * @param {Object} [overrides]  Any user_schema field(s) to override.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_user = async (overrides = {}) => {
  const data = await build_user_data(overrides);
  return user_model.create(data);
};

/**
 * Create and persist a superuser.
 *
 * Superusers bypass all `check_permission_policy` checks.  Use this
 * factory when testing "allowed for all" happy paths.
 *
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_superuser = async (overrides = {}) => {
  return create_user({ user_type: 'superuser', ...overrides });
};

/**
 * Create and persist an inactive user (is_active: false).
 *
 * `check_permission_policy` returns 401 for inactive users.  Use this
 * to test the inactive-user rejection path.
 *
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_inactive_user = async (overrides = {}) => {
  return create_user({ is_active: false, ...overrides });
};

/**
 * Create and persist an admin user by bypassing Mongoose schema validation.
 *
 * `user_type: 'admin'` is not a valid enum value in the Mongoose user schema,
 * so this factory inserts directly via the raw MongoDB collection driver.
 * Use this for endpoints that perform an inline admin check:
 *   `user_model.findOne({ _id: user_id, user_type: 'admin' })`
 *
 * @param {Object} [overrides]  Any raw document field(s) to override.
 * @returns {Promise<{ _id: import('mongoose').Types.ObjectId }>}
 */
export const create_admin_user = async (overrides = {}) => {
  const n = next_user();
  const result = await mongoose.connection.collection('users').insertOne({
    user_name: `Admin User ${n}`,
    user_email: `admin.${n}@example.com`,
    user_password: 'hashed_password',
    user_email_verified: true,
    user_type: 'admin',
    is_active: true,
    is_deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return { _id: result.insertedId };
};

// ─── Domain workspace factory ─────────────────────────────────────────────────

/**
 * Build a plain-object domain workspace payload with defaults.
 *
 * @param {Object} [overrides]
 * @returns {Object}
 */
const build_domain_workspace_data = (overrides = {}) => {
  const n = next_workspace();
  return {
    title: `Test Workspace ${n}`,
    visibility: 'private',
    membership_restriction: 'restricted',
    assigned_users: [],
    ...overrides,
  };
};

/**
 * Create and persist a domain workspace.
 *
 * Pass `assigned_users: [user._id]` to associate users with it.
 *
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_domain_workspace = async (overrides = {}) => {
  const data = build_domain_workspace_data(overrides);
  return domain_workspace_model.create(data);
};

// ─── Vendor workspace factory ─────────────────────────────────────────────────

/**
 * Build a plain-object vendor workspace payload with defaults.
 *
 * @param {import('mongoose').Types.ObjectId} domain_id  The parent domain workspace _id.
 * @param {Object} [overrides]
 * @returns {Object}
 */
const build_vendor_workspace_data = (domain_id, overrides = {}) => {
  const n = next_vendor();
  return {
    name: `Test Vendor ${n}`,
    domain: domain_id,
    visibility: 'private',
    assigned_users: [],
    ...overrides,
  };
};

/**
 * Create and persist a vendor workspace linked to a domain workspace.
 *
 * @param {import('mongoose').Types.ObjectId} domain_id  Parent domain workspace _id.
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_vendor_workspace = async (domain_id, overrides = {}) => {
  const data = build_vendor_workspace_data(domain_id, overrides);
  return vendor_workspace_model.create(data);
};

// ─── Permission policy factory ────────────────────────────────────────────────

/**
 * Build a plain-object permission policy payload.
 *
 * @param {string} policy_key  e.g. "invoice:create"
 * @param {"allow"|"deny"} type
 * @param {Object} [overrides]
 * @returns {Object}
 */
const build_policy_data = (policy_key, type = 'allow', overrides = {}) => {
  const n = next_policy();
  return {
    name: `Policy ${n} - ${policy_key}`,
    description: `Auto-generated policy for ${policy_key}`,
    policy: policy_key,
    type,
    ...overrides,
  };
};

/**
 * Create and persist a permission policy document.
 *
 * @param {string} policy_key  The policy string, e.g. "invoice:view".
 * @param {"allow"|"deny"} [type="allow"]
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_permission_policy = async (
  policy_key,
  type = 'allow',
  overrides = {}
) => {
  const data = build_policy_data(policy_key, type, overrides);
  return permission_policy_model.create(data);
};

// ─── Permission group factory ─────────────────────────────────────────────────

/**
 * Build a plain-object permission group payload.
 *
 * @param {Object} [overrides]
 * @returns {Object}
 */
const build_group_data = (overrides = {}) => {
  const n = next_group();
  return {
    name: `Test Group ${n}`,
    description: `Auto-generated group ${n}`,
    permission_policies: [],
    users: [],
    ...overrides,
  };
};

/**
 * Create and persist a permission group.
 *
 * Pass `users: [user._id]` and `permission_policies: [policy._id]` to
 * wire up a complete IAM scenario for permission middleware tests.
 *
 * @param {Object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_permission_group = async (overrides = {}) => {
  const data = build_group_data(overrides);
  return permission_group_model.create(data);
};

// ─── Compound helpers ─────────────────────────────────────────────────────────

/**
 * Create a user with a specific policy directly attached at the user level.
 *
 * This is the most common scenario for permission integration tests:
 * a user who has been granted (or denied) a specific policy.
 *
 * @param {string} policy_key    e.g. "invoice:view"
 * @param {"allow"|"deny"} [type="allow"]
 * @param {Object} [user_overrides]
 * @returns {Promise<{ user: Document, policy: Document }>}
 */
export const create_user_with_policy = async (
  policy_key,
  type = 'allow',
  user_overrides = {}
) => {
  const policy = await create_permission_policy(policy_key, type);
  const user = await create_user({
    user_permission_policies: [policy._id],
    ...user_overrides,
  });
  return { user, policy };
};

/**
 * Create a user whose policy is assigned at the group level, not directly.
 *
 * This exercises the group-level policy resolution path in
 * `check_permission_policy`.
 *
 * @param {string} policy_key    e.g. "invoice:view"
 * @param {"allow"|"deny"} [type="allow"]
 * @param {Object} [user_overrides]
 * @returns {Promise<{ user: Document, policy: Document, group: Document }>}
 */
export const create_user_with_group_policy = async (
  policy_key,
  type = 'allow',
  user_overrides = {}
) => {
  const user = await create_user(user_overrides);
  const policy = await create_permission_policy(policy_key, type);
  const group = await create_permission_group({
    users: [user._id],
    permission_policies: [policy._id],
  });
  return { user, policy, group };
};

// ─── Department factory ───────────────────────────────────────────────────────

/**
 * Create and persist a department in the in-memory database.
 *
 * Uses a module-level counter so every call within a test run produces a
 * unique name, even across test files that share the same module instance.
 *
 * @param {Object} [overrides]  Any department_schema field(s) to override.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_department = async (overrides = {}) => {
  const n = next_department();
  return department_model.create({
    name: `Department ${n}`,
    status: 'active',
    no_of_employees: n * 5,
    ...overrides,
  });
};

// ─── Designation factory ──────────────────────────────────────────────────────

/**
 * Create and persist a designation in the in-memory database.
 *
 * Requires a `department` ObjectId because the schema marks it as required.
 * When no `department` override is provided the factory creates a fresh
 * department document and uses its `_id` automatically, so callers do not
 * need to arrange a department separately unless they want to control which
 * department the designation belongs to.
 *
 * Uses a module-level counter so every call within a test run produces a
 * unique name, even across test files that share the same module instance.
 *
 * @param {Object} [overrides]  Any designation_schema field(s) to override.
 *   Pass `department: some_dept._id` to link to a specific department.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_designation = async (overrides = {}) => {
  const n = next_designation();

  let department_id = overrides.department;
  if (!department_id) {
    const dept = await create_department();
    department_id = dept._id;
  }

  return designation_model.create({
    name: `Designation ${n}`,
    status: 'active',
    no_of_employees: n * 3,
    department: department_id,
    ...overrides,
  });
};

// ─── Company factory ──────────────────────────────────────────────────────────

/**
 * Create and persist a company in the in-memory database.
 *
 * Employees require a company reference.  Use this factory to satisfy
 * that constraint without repeating the full company payload in every
 * attendance-related test.
 *
 * @param {Object} [overrides]  Any company_schema field(s) to override.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_company = async (overrides = {}) => {
  const n = next_company();
  return company_model.create({
    name: `Test Company ${n}`,
    email: `company${n}@example.com`,
    phone: `+977-980000${String(n).padStart(4, '0')}`,
    address: {
      address: `${n} Test Street`,
      country: 'Nepal',
      state: 'Bagmati',
      city: 'Kathmandu',
      zip_code: '44600',
    },
    status: 'active',
    ...overrides,
  });
};

// ─── Employee factory ─────────────────────────────────────────────────────────

/**
 * Create and persist an employee in the in-memory database.
 *
 * Requires a company reference.  When no `company` override is provided
 * the factory creates a fresh company document automatically.
 *
 * The attendance controller links attendance records to the user document
 * via the JWT user_id.  The `employee` ObjectId on an attendance record
 * is that same user _id — the controller does NOT look up a separate
 * employee document when punching in.  However, the admin endpoint
 * (`handle_get_todays_attendance_admin`) calls `employee_model.find`
 * for absent employees, so a real employee document is needed there.
 *
 * @param {Object} [overrides]  Any employee_schema field(s) to override.
 *   Pass `company: some_company._id` to link to a specific company.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_employee = async (overrides = {}) => {
  const n = next_employee();

  let company_id = overrides.company;
  if (!company_id) {
    const company = await create_company();
    company_id = company._id;
  }

  return employee_model.create({
    employee_id: `EMP-${String(n).padStart(4, '0')}`,
    name: `Employee ${n}`,
    join_date: new Date('2023-01-01'),
    email: `employee${n}@example.com`,
    phone: `+977-981000${String(n).padStart(4, '0')}`,
    gender: 'male',
    company: company_id,
    address: {
      address: `${n} Employee Street`,
      country: 'Nepal',
      state: 'Bagmati',
      city: 'Kathmandu',
      zip_code: '44600',
    },
    ...overrides,
  });
};

// ─── Attendance factory ───────────────────────────────────────────────────────

/**
 * Create and persist an attendance record directly via the model.
 *
 * The `employee` field must be a valid ObjectId — it is the same _id
 * used by the controller (the user's _id from the JWT payload).  Callers
 * must pass `employee: user._id` so that `handle_get_employee_attendances`
 * and the punch-state checks find the record when they query by that id.
 *
 * Defaults produce a minimal "punched-in, not yet out" record for today,
 * which is the most common starting state for business-logic edge-case
 * tests (e.g. double punch-in, break without punch-in, etc.).
 *
 * @param {Object} [overrides]  Any attendance_schema field(s) to override.
 *   Always pass `employee: <ObjectId>`.
 * @returns {Promise<import('mongoose').Document>}
 */
export const create_attendance = async (overrides = {}) => {
  const n = next_attendance();
  const today = new Date().toISOString().split('T')[0];

  return attendance_model.create({
    employee: new mongoose.Types.ObjectId(),
    attendance_type: 'regular',
    attendance_date: today,
    check_in: new Date(),
    attendance_status: 'present',
    is_late: false,
    late_minutes: 0,
    break_minutes: 0,
    break_start: null,
    break_end: null,
    ...overrides,
  });
};
