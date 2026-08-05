/**
 * tests/employee/employee.test.js
 *
 * Integration tests for the employee module.
 *
 * Routes under test (mounted at /api/employee):
 *   GET  /api/employee/                     → handle_get_employees
 *   GET  /api/employee/:employee_id         → handle_get_employee
 *   POST /api/employee/add                  → handle_add_employee
 *   POST /api/employee/edit/:employee_id    → handle_edit_employee
 *   POST /api/employee/delete/:employee_id  → handle_delete_employee
 *
 * KNOWN GAPS (see tests/report.md):
 *   CRITICAL — handle_add_employee, handle_edit_employee, handle_delete_employee have no
 *              authentication or authorization middleware. Unauthenticated callers can freely
 *              create, modify, and delete employee records.
 *   MEDIUM   — employee_id auto-increment uses parseInt() with no NaN guard. When the most
 *              recent employee document has a non-numeric ID suffix (e.g. "EMP-SEED1"), the
 *              controller generates "EMP-0NaN" instead of a valid sequential ID.
 *
 * No S3 / file uploads exist in this module — no mock is needed.
 * All mutating operations use POST per the API convention.
 *
 * Key schema note: the address sub-schema marks every sub-field as
 * required:true.  Even though the top-level address key has no explicit
 * required: true on the parent, Mongoose flattens nested path definitions and
 * still enforces required validators on each sub-field — so omitting address
 * entirely from the POST body causes a Mongoose ValidationError and a 500
 * response from the controller.
 */

import mongoose from 'mongoose';

// ─── Deferred app import ──────────────────────────────────────────────────────
// app must be imported after the in-memory MongoDB is up (handled by setup.js).

let app;

import request from 'supertest';
import employee_model from '../../models/employee.model.js';

// ─── Shared address fixture ───────────────────────────────────────────────────
// All tests that create an employee (via factory or via API) must supply every
// address sub-field because the Mongoose sub-schema marks them all required.

const DEFAULT_ADDRESS = {
  address: '1 Main St',
  country: 'US',
  state: 'CA',
  city: 'SF',
  zip_code: '94102',
};

// ─── Local employee factory ───────────────────────────────────────────────────
// Uses a non-numeric EMP-SEEDx id namespace. This deliberately does NOT work
// around the NaN bug in the controller's auto-increment logic — factory records
// are used only for seeding read/edit/delete tests, never as the basis for
// testing sequential ID generation.

let _employee_counter = 0;

const create_employee = async (overrides = {}) => {
  const n = ++_employee_counter;
  return employee_model.create({
    employee_id: `EMP-SEED${n}`,
    name: `Employee ${n}`,
    join_date: new Date('2024-01-01'),
    email: `employee.${n}@example.com`,
    phone: `+977-98000000${n.toString().padStart(2, '0')}`,
    company: new mongoose.Types.ObjectId(),
    address: { ...DEFAULT_ADDRESS },
    ...overrides,
  });
};

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────

beforeAll(async () => {
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  // Reset the factory counter so each test starts from EMP-SEED1.
  _employee_counter = 0;
});

// ─── GET /api/employee ────────────────────────────────────────────────────────

describe('GET /api/employee — handle_get_employees', () => {
  it('returns 200 with status success and the correct message', async () => {
    const res = await request(app).get('/api/employee');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employees fetched successfully');
  });

  it('returns data as an empty array when no employees exist', async () => {
    const res = await request(app).get('/api/employee');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns a data array containing the seeded employee when one exists', async () => {
    const seeded = await create_employee({ name: 'Alice Seed' });

    const res = await request(app).get('/api/employee');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(seeded._id.toString());
    expect(res.body.data[0].name).toBe('Alice Seed');
  });

  it('returns multiple employees when multiple records are seeded', async () => {
    await create_employee({ name: 'Bob' });
    await create_employee({ name: 'Carol' });

    const res = await request(app).get('/api/employee');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const names = res.body.data.map((e) => e.name);
    expect(names).toContain('Bob');
    expect(names).toContain('Carol');
  });

  it('includes the company field (populated) in each employee document', async () => {
    await create_employee();

    const res = await request(app).get('/api/employee');

    expect(res.status).toBe(200);
    // company is an ObjectId ref; populate returns null when the referenced
    // document does not exist, but the key is still present in the response.
    expect(res.body.data[0]).toHaveProperty('company');
    expect(res.body.data[0].company).toBeNull();
  });
});

// ─── GET /api/employee/:employee_id ──────────────────────────────────────────

describe('GET /api/employee/:employee_id — handle_get_employee', () => {
  it('returns 200 with the correct document for an existing employee', async () => {
    const employee = await create_employee({ name: 'Dave Fetch' });

    const res = await request(app).get(`/api/employee/${employee._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee fetched successfully');
    expect(res.body.data._id).toBe(employee._id.toString());
    expect(res.body.data.name).toBe('Dave Fetch');
  });

  it('includes the company field in the response even when the referenced document does not exist', async () => {
    const employee = await create_employee();

    const res = await request(app).get(`/api/employee/${employee._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('company');
    expect(res.body.data.company).toBeNull();
  });

  it('returns 404 when employee_id is a valid ObjectId with no matching document', async () => {
    const missing_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/employee/${missing_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Employee not found');
  });

  it('returns 500 for a malformed non-ObjectId path parameter', async () => {
    const res = await request(app).get('/api/employee/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while fetching employee');
  });
});

// ─── POST /api/employee/add ───────────────────────────────────────────────────

describe('POST /api/employee/add — handle_add_employee', () => {
  it('returns 201 with status success and the correct message when a valid body is sent', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Eve New',
        join_date: '2024-06-01',
        email: 'eve.new@example.com',
        phone: '+977-9800000001',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee added successfully');
  });

  it('returns the newly created employee document in data with the submitted name', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Frank Create',
        join_date: '2024-06-01',
        email: 'frank.create@example.com',
        phone: '+977-9800000002',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(201);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.name).toBe('Frank Create');
  });

  it('auto-generates employee_id as EMP-0001 for the first employee created via the API', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Grace First',
        join_date: '2024-06-01',
        email: 'grace.first@example.com',
        phone: '+977-9800000003',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.employee_id).toBe('EMP-0001');
  });

  it('auto-generates sequential employee_ids EMP-0001 and EMP-0002 for two consecutive API calls', async () => {
    const res_one = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Hank One',
        join_date: '2024-06-01',
        email: 'hank.one@example.com',
        phone: '+977-9800000004',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    const res_two = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Iris Two',
        join_date: '2024-06-01',
        email: 'iris.two@example.com',
        phone: '+977-9800000005',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res_one.status).toBe(201);
    expect(res_two.status).toBe(201);
    expect(res_one.body.data.employee_id).toBe('EMP-0001');
    expect(res_two.body.data.employee_id).toBe('EMP-0002');
  });

  it('accepts a JSON-stringified address and stores the parsed address object correctly', async () => {
    const address_payload = {
      address: '99 Address Rd',
      country: 'NP',
      state: 'Bagmati',
      city: 'Kathmandu',
      zip_code: '44600',
    };

    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Jake Address',
        join_date: '2024-06-01',
        email: 'jake.address@example.com',
        phone: '+977-9800000006',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(address_payload),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.address.address).toBe('99 Address Rd');
    expect(res.body.data.address.country).toBe('NP');
    expect(res.body.data.address.city).toBe('Kathmandu');
    expect(res.body.data.address.zip_code).toBe('44600');
    expect(res.body.data.address.state).toBe('Bagmati');
  });

  it('returns 500 when name is missing because Mongoose validation fails', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        // name intentionally omitted
        join_date: '2024-06-01',
        email: 'noname@example.com',
        phone: '+977-9800000007',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when join_date is missing because Mongoose validation fails', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'No Date',
        // join_date intentionally omitted
        email: 'nodate@example.com',
        phone: '+977-9800000008',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when email is missing because Mongoose validation fails', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'No Email',
        join_date: '2024-06-01',
        // email intentionally omitted
        phone: '+977-9800000009',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when phone is missing because Mongoose validation fails', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'No Phone',
        join_date: '2024-06-01',
        email: 'nophone@example.com',
        // phone intentionally omitted
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when company is missing because Mongoose validation fails', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'No Company',
        join_date: '2024-06-01',
        email: 'nocompany@example.com',
        phone: '+977-9800000010',
        // company intentionally omitted
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when name is a blank string because sanitizePayload strips it before Mongoose validation', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: '   ',
        join_date: '2024-06-01',
        email: 'blankname@example.com',
        phone: '+977-9800000011',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  it('returns 500 when address is omitted because Mongoose sub-field validators fire even when the parent key is absent', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'No Address Employee',
        join_date: '2024-06-01',
        email: 'noaddress@example.com',
        phone: '+977-9800000012',
        company: new mongoose.Types.ObjectId().toString(),
        // address intentionally omitted — Mongoose validates required sub-fields regardless
      });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while adding employee');
  });

  // ── GAP: CRITICAL — missing auth middleware ───────────────────────────────
  // Unauthenticated callers should be rejected before the handler runs.
  // Currently FAILS: controller has no authenticate middleware, returns 201.
  it('returns 401 when no authentication cookie is provided', async () => {
    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'Unauth Employee',
        join_date: '2024-06-01',
        email: 'unauth@example.com',
        phone: '+977-9800000099',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });
    // No cookie attached — must be rejected.
    expect(res.status).toBe(401);
  });

  // ── GAP: MEDIUM — parseInt NaN when last employee has non-numeric ID suffix ─
  // Controller: `parseInt(last_employee.employee_id.split("-")[1], 10)` returns
  // NaN for "SEED1", producing employee_id "EMP-0NaN" instead of "EMP-0001".
  // Currently FAILS: generated ID does not match /^EMP-\d{4}$/.
  it('generates a valid sequential employee_id when the last stored record has a non-numeric ID suffix', async () => {
    await create_employee(); // seeds EMP-SEED1 — non-numeric suffix triggers the NaN path

    const res = await request(app)
      .post('/api/employee/add')
      .send({
        name: 'After Seed',
        join_date: '2024-06-01',
        email: 'after.seed@example.com',
        phone: '+977-9800000098',
        company: new mongoose.Types.ObjectId().toString(),
        address: JSON.stringify(DEFAULT_ADDRESS),
      });

    expect(res.status).toBe(201);
    // Should fall back to EMP-0001 (or any valid 4-digit padded ID).
    // Fails today because parseInt('SEED1', 10) === NaN → ID becomes 'EMP-0NaN'.
    expect(res.body.data.employee_id).toMatch(/^EMP-\d{4}$/);
  });
});

// ─── POST /api/employee/edit/:employee_id ────────────────────────────────────

describe('POST /api/employee/edit/:employee_id — handle_edit_employee', () => {
  it('returns 200 with status success and the correct message when updating an existing employee', async () => {
    const employee = await create_employee({ name: 'Old Name' });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee updated successfully');
  });

  it('returns the updated document in data reflecting the new name', async () => {
    const employee = await create_employee({ name: 'Before Edit' });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ name: 'After Edit' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('After Edit');
  });

  it('returns the updated document in data reflecting a new email', async () => {
    const employee = await create_employee({ email: 'old.email@example.com' });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ email: 'new.email@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('new.email@example.com');
  });

  it('returns the updated document in data reflecting a new phone number', async () => {
    const employee = await create_employee({ phone: '+977-9800000000' });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ phone: '+977-9811111111' });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('+977-9811111111');
  });

  it('returns 404 when employee_id is a valid ObjectId with no matching document', async () => {
    const missing_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/employee/edit/${missing_id}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Employee not found');
  });

  it('preserves the original name when a blank string is sent because sanitizePayload strips empty values', async () => {
    const original_name = 'Immutable Name';
    const employee = await create_employee({ name: original_name });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ name: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(original_name);
  });

  it('accepts a JSON-stringified address on edit and stores the parsed object correctly', async () => {
    const employee = await create_employee();
    const updated_address = {
      address: '99 Edit Ave',
      country: 'NP',
      state: 'Bagmati',
      city: 'Kathmandu',
      zip_code: '44600',
    };

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ address: JSON.stringify(updated_address) });

    expect(res.status).toBe(200);
    expect(res.body.data.address.address).toBe('99 Edit Ave');
    expect(res.body.data.address.city).toBe('Kathmandu');
    expect(res.body.data.address.zip_code).toBe('44600');
    expect(res.body.data.address.state).toBe('Bagmati');
  });

  it('returns 500 for a malformed non-ObjectId path parameter', async () => {
    const res = await request(app)
      .post('/api/employee/edit/not-a-valid-id')
      .send({ name: 'Ghost' });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while updating employee');
  });

  // ── GAP: CRITICAL — missing auth middleware ───────────────────────────────
  // Currently FAILS: controller has no authenticate middleware, returns 200.
  it('returns 401 when no authentication cookie is provided', async () => {
    const employee = await create_employee({ name: 'Protected Employee' });

    const res = await request(app)
      .post(`/api/employee/edit/${employee._id}`)
      .send({ name: 'Unauth Edit' });
    // No cookie attached — must be rejected.
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/employee/delete/:employee_id ───────────────────────────────────

describe('POST /api/employee/delete/:employee_id — handle_delete_employee', () => {
  it('returns 200 with status success and the correct message when deleting an existing employee', async () => {
    const employee = await create_employee();

    const res = await request(app)
      .post(`/api/employee/delete/${employee._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Employee deleted successfully');
  });

  it('returns the deleted document in data so the caller can inspect what was removed', async () => {
    const employee = await create_employee({ name: 'To Be Deleted' });

    const res = await request(app)
      .post(`/api/employee/delete/${employee._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(employee._id.toString());
    expect(res.body.data.name).toBe('To Be Deleted');
  });

  it('actually removes the document from the database after deletion', async () => {
    const employee = await create_employee();

    await request(app).post(`/api/employee/delete/${employee._id}`);

    const in_db = await employee_model.findById(employee._id);
    expect(in_db).toBeNull();
  });

  it('returns 404 when employee_id is a valid ObjectId with no matching document', async () => {
    const missing_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/employee/delete/${missing_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Employee not found');
  });

  it('returns 500 for a malformed non-ObjectId path parameter', async () => {
    const res = await request(app)
      .post('/api/employee/delete/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while deleting employee');
  });

  // ── GAP: CRITICAL — missing auth middleware ───────────────────────────────
  // Currently FAILS: controller has no authenticate middleware, returns 200.
  it('returns 401 when no authentication cookie is provided', async () => {
    const employee = await create_employee();

    const res = await request(app)
      .post(`/api/employee/delete/${employee._id}`);
    // No cookie attached — must be rejected.
    expect(res.status).toBe(401);
  });
});
