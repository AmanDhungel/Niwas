import { jest } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

let app;

import request from 'supertest';
import { reset_s3_mocks } from '../mocks/s3.mock.js';
import designation_model from '../../models/hrm/designation.model.js';
import { create_department, create_designation } from '../helpers/factories.js';

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_designation_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  reset_s3_mocks();
});

// ─── GET /api/designation/ ────────────────────────────────────────────────────

describe('GET /api/designation/', () => {
  it('returns 200 without any auth cookie because the route has no authenticate guard', async () => {
    const res = await request(app).get('/api/designation/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('returns 200 with an empty array when no designations exist', async () => {
    const res = await request(app).get('/api/designation/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designations fetched successfully');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with an array containing the seeded designation', async () => {
    await create_designation({ name: 'Software Engineer' });

    const res = await request(app).get('/api/designation/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designations fetched successfully');
    expect(res.body.data[0].name).toBe('Software Engineer');
  });

  it('returns 200 with all seeded designations when multiple exist', async () => {
    await create_designation({ name: 'Manager' });
    await create_designation({ name: 'Analyst' });
    await create_designation({ name: 'Director' });

    const res = await request(app).get('/api/designation/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designations fetched successfully');
    expect(res.body.data).toHaveLength(3);
  });

  it('returns each document with name, status, no_of_employees, and department fields', async () => {
    const dept = await create_department({ name: 'Engineering' });
    await create_designation({
      name: 'Tech Lead',
      status: 'active',
      no_of_employees: 7,
      department: dept._id,
    });

    const res = await request(app).get('/api/designation/');

    expect(res.status).toBe(200);
    const tech_lead = res.body.data.find(d => d.name === 'Tech Lead');
    expect(tech_lead).toBeDefined();
    expect(tech_lead.status).toBe('active');
    expect(tech_lead.no_of_employees).toBe(7);
    expect(tech_lead.department).toBeDefined();
  });

  it('populates the department field so it returns a full department object not just an id', async () => {
    const dept = await create_department({ name: 'HR' });
    await create_designation({ name: 'HR Officer', department: dept._id });

    const res = await request(app).get('/api/designation/');

    expect(res.status).toBe(200);
    expect(typeof res.body.data[0].department).toBe('object');
    expect(res.body.data[0].department.name).toBe('HR');
  });
});

// ─── GET /api/designation/:designation_id ─────────────────────────────────────

describe('GET /api/designation/:designation_id', () => {
  it('returns 200 with the correct document when designation exists', async () => {
    const designation = await create_designation({ name: 'Find Me' });

    const res = await request(app).get(`/api/designation/${designation._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designation fetched successfully');
    expect(res.body.data._id).toBe(designation._id.toString());
    expect(res.body.data.name).toBe('Find Me');
  });

  it('returns 200 and data.status matches the stored enum value', async () => {
    const designation = await create_designation({ name: 'Status Check', status: 'inactive' });

    const res = await request(app).get(`/api/designation/${designation._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 200 and data.no_of_employees matches the stored number', async () => {
    const designation = await create_designation({ name: 'Headcount Role', no_of_employees: 42 });

    const res = await request(app).get(`/api/designation/${designation._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(42);
  });

  it('populates the department field on a single designation fetch', async () => {
    const dept = await create_department({ name: 'Finance' });
    const designation = await create_designation({ name: 'Finance Lead', department: dept._id });

    const res = await request(app).get(`/api/designation/${designation._id}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.department).toBe('object');
    expect(res.body.data.department.name).toBe('Finance');
    expect(res.body.data.department._id).toBe(dept._id.toString());
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/designation/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Designation not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).get('/api/designation/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while fetching designation');
  });
});

// ─── POST /api/designation/add ────────────────────────────────────────────────

describe('POST /api/designation/add', () => {
  it('returns 201 with status success when a valid payload is sent', async () => {
    const dept = await create_department({ name: 'Product' });

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Product Manager', department: dept._id, status: 'active', no_of_employees: 4 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designation added successfully');
  });

  it('returns data.name matching the sent name value', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Lead Developer', department: dept._id });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Lead Developer');
  });

  it('returns data.status matching the sent status value', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Support Agent', department: dept._id, status: 'inactive' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns data.no_of_employees matching the sent value', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'QA Engineer', department: dept._id, no_of_employees: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.no_of_employees).toBe(10);
  });

  it('returns data.status as active when status is not sent because of schema default', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Default Status Role', department: dept._id });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
  });

  it('returns data.no_of_employees as 0 when not provided because of schema default', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Default Headcount Role', department: dept._id });

    expect(res.status).toBe(201);
    expect(res.body.data.no_of_employees).toBe(0);
  });

  it('returns a data object with a populated _id field after creation', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'ID Check Role', department: dept._id });

    expect(res.status).toBe(201);
    expect(res.body.data._id).toBeDefined();
    expect(typeof res.body.data._id).toBe('string');
  });

  it('returns 400 when name is missing because Mongoose ValidationError is handled', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ department: dept._id, status: 'active' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Designation name and department are required');
  });

  it('returns 400 when department is missing because it is required by the schema', async () => {
    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'No Dept Role', status: 'active' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Designation name and department are required');
  });

  it('persists the new designation to the database so it is findable by _id', async () => {
    const dept = await create_department();

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Persistence Check Role', department: dept._id });

    expect(res.status).toBe(201);

    const found = await designation_model.findById(res.body.data._id);
    expect(found).not.toBeNull();
    expect(found.name).toBe('Persistence Check Role');
  });

  it('does not persist a designation when required fields are missing', async () => {
    await request(app)
      .post('/api/designation/add')
      .send({ status: 'active', no_of_employees: 2 });

    const count = await designation_model.countDocuments();
    expect(count).toBe(0);
  });

  it('stores the department reference so re-fetch populates the linked department document', async () => {
    const dept = await create_department({ name: 'Linked Dept' });

    const res = await request(app)
      .post('/api/designation/add')
      .send({ name: 'Linked Role', department: dept._id });

    expect(res.status).toBe(201);

    const found = await designation_model.findById(res.body.data._id).populate('department');
    expect(found.department.name).toBe('Linked Dept');
  });
});

// ─── POST /api/designation/edit/:designation_id ───────────────────────────────

describe('POST /api/designation/edit/:designation_id', () => {
  it('returns 200 and data.name reflects the updated value', async () => {
    const designation = await create_designation({ name: 'Before Edit' });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ name: 'After Edit' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designation updated successfully');
    expect(res.body.data.name).toBe('After Edit');
  });

  it('returns 200 and data.status reflects the updated enum value', async () => {
    const designation = await create_designation({ name: 'Status Toggle', status: 'active' });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 200 and data.no_of_employees reflects the updated numeric value', async () => {
    const designation = await create_designation({ name: 'Headcount Update', no_of_employees: 5 });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ no_of_employees: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(30);
  });

  it('does not overwrite existing name when a blank name is sent because sanitizePayload strips it', async () => {
    const designation = await create_designation({ name: 'Original Name' });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ name: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Original Name');
  });

  it('does not strip no_of_employees when updated value is 0 because sanitizePayload preserves falsy numbers', async () => {
    const designation = await create_designation({ name: 'Zero Headcount Role', no_of_employees: 15 });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ no_of_employees: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(0);

    const found = await designation_model.findById(designation._id);
    expect(found.no_of_employees).toBe(0);
  });

  it('returns 200 and persists the change to the database so re-fetch reflects the update', async () => {
    const designation = await create_designation({ name: 'DB Persist Check', no_of_employees: 10 });

    await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ no_of_employees: 99 });

    const found = await designation_model.findById(designation._id);
    expect(found.no_of_employees).toBe(99);
  });

  it('returns 200 and data._id matches the designation_id used in the URL', async () => {
    const designation = await create_designation({ name: 'ID Match Check' });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({ name: 'ID Match Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(designation._id.toString());
  });

  // ── GAP [HIGH]: handle_edit_designation does not chain .populate("department")
  // on findByIdAndUpdate, so the edit response returns a raw ObjectId string for
  // department instead of a populated object. The GET handler populates correctly,
  // creating an inconsistent response shape between the two endpoints.
  // The previous workaround used .toString() on the department value, which passes
  // for both a raw string and a populated object, silently hiding the inconsistency.
  // Currently FAILS: typeof res.body.data.department is 'string', not 'object'.
  it('returns the department as a populated object in the edit response, not a raw ObjectId', async () => {
    const dept_before = await create_department({ name: 'Dept Before' });
    const dept_after = await create_department({ name: 'Dept After' });
    const designation = await create_designation({
      name: 'Multi Field Before',
      status: 'active',
      no_of_employees: 3,
      department: dept_before._id,
    });

    const res = await request(app)
      .post(`/api/designation/edit/${designation._id}`)
      .send({
        name: 'Multi Field After',
        status: 'inactive',
        no_of_employees: 50,
        department: dept_after._id,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Multi Field After');
    expect(res.body.data.status).toBe('inactive');
    expect(res.body.data.no_of_employees).toBe(50);
    // Edit response must return department as a populated object, consistent with GET.
    // Fails today because findByIdAndUpdate has no .populate("department") chain.
    expect(typeof res.body.data.department).toBe('object');
    expect(res.body.data.department._id).toBe(dept_after._id.toString());
    expect(res.body.data.department.name).toBe('Dept After');
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/designation/edit/${unknown_id}`)
      .send({ name: 'Ghost Edit' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Designation not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app)
      .post('/api/designation/edit/not-a-valid-id')
      .send({ name: 'Bad ID Edit' });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while updating designation');
  });
});

// ─── POST /api/designation/delete/:designation_id ─────────────────────────────

describe('POST /api/designation/delete/:designation_id', () => {
  it('returns 200 with status success and message Designation deleted successfully', async () => {
    const designation = await create_designation({ name: 'To Be Deleted' });

    const res = await request(app).post(`/api/designation/delete/${designation._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Designation deleted successfully');
  });

  it('returns data containing the deleted document with the correct name and _id', async () => {
    const designation = await create_designation({ name: 'Returned On Delete' });

    const res = await request(app).post(`/api/designation/delete/${designation._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Returned On Delete');
    expect(res.body.data._id).toBe(designation._id.toString());
  });

  it('removes the designation from the database so a re-fetch returns null', async () => {
    const designation = await create_designation({ name: 'Gone After Delete' });

    await request(app).post(`/api/designation/delete/${designation._id}`);

    const found = await designation_model.findById(designation._id);
    expect(found).toBeNull();
  });

  it('leaves other designations intact when only one is deleted', async () => {
    const designation_a = await create_designation({ name: 'Delete Me' });
    const designation_b = await create_designation({ name: 'Keep Me' });

    await request(app).post(`/api/designation/delete/${designation_a._id}`);

    const remaining = await designation_model.find();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Keep Me');
    expect(remaining[0]._id.toString()).toBe(designation_b._id.toString());
  });

  it('reduces the total designation count by exactly one after a single deletion', async () => {
    await create_designation({ name: 'Alpha' });
    await create_designation({ name: 'Beta' });
    const designation_to_delete = await create_designation({ name: 'Gamma' });

    await request(app).post(`/api/designation/delete/${designation_to_delete._id}`);

    const count = await designation_model.countDocuments();
    expect(count).toBe(2);
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(`/api/designation/delete/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Designation not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).post('/api/designation/delete/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while deleting designation');
  });
});
