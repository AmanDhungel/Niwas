import { jest } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../utils/s3.util.js', async () => {
  const { s3_mock } = await import('../mocks/s3.mock.js');
  return s3_mock;
});

let app;

import request from 'supertest';
import { reset_s3_mocks } from '../mocks/s3.mock.js';
import department_model from '../../models/hrm/department.model.js';
import { create_department } from '../helpers/factories.js';

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_department_tests';
  const app_module = await import('../../app.js');
  app = app_module.app;
});

beforeEach(() => {
  reset_s3_mocks();
});

// ─── GET /api/department/ ─────────────────────────────────────────────────────

describe('GET /api/department/', () => {
  it('returns 200 with an empty array when no departments exist', async () => {
    const res = await request(app).get('/api/department/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Departments fetched successfully');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with an array containing the seeded department', async () => {
    await create_department({ name: 'Engineering' });

    const res = await request(app).get('/api/department/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Departments fetched successfully');
    expect(res.body.data[0].name).toBe('Engineering');
  });

  it('returns 200 with all seeded departments when multiple exist', async () => {
    await create_department({ name: 'HR' });
    await create_department({ name: 'Finance' });
    await create_department({ name: 'Marketing' });

    const res = await request(app).get('/api/department/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Departments fetched successfully');
    expect(res.body.data).toHaveLength(3);
  });

  it('returns each document with name, status, and no_of_employees fields', async () => {
    await create_department({ name: 'Operations', status: 'active', no_of_employees: 12 });

    const res = await request(app).get('/api/department/');

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Operations');
    expect(res.body.data[0].status).toBe('active');
    expect(res.body.data[0].no_of_employees).toBe(12);
  });
});

// ─── GET /api/department/:department_id ───────────────────────────────────────

describe('GET /api/department/:department_id', () => {
  it('returns 200 with the correct document when department exists', async () => {
    const dept = await create_department({ name: 'Find Me Dept' });

    const res = await request(app).get(`/api/department/${dept._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Department fetched successfully');
    expect(res.body.data._id).toBe(dept._id.toString());
    expect(res.body.data.name).toBe('Find Me Dept');
  });

  it('returns 200 and data.status matches the stored enum value', async () => {
    const dept = await create_department({ name: 'Status Check', status: 'inactive' });

    const res = await request(app).get(`/api/department/${dept._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 200 and data.no_of_employees matches the stored number', async () => {
    const dept = await create_department({ name: 'Headcount Dept', no_of_employees: 42 });

    const res = await request(app).get(`/api/department/${dept._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(42);
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/department/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Department not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).get('/api/department/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while fetching department');
  });
});

// ─── POST /api/department/add ─────────────────────────────────────────────────

describe('POST /api/department/add', () => {
  it('returns 201 with status success when valid name is sent', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Legal', status: 'active', no_of_employees: 8 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Department added successfully');
  });

  it('returns data.name matching the sent name value', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Product', status: 'active' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Product');
  });

  it('returns data.status matching the sent status value', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Support', status: 'inactive' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns data.no_of_employees matching the sent value', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Design', status: 'active', no_of_employees: 20 });

    expect(res.status).toBe(201);
    expect(res.body.data.no_of_employees).toBe(20);
  });

  it('returns data.no_of_employees as 0 when not provided because of schema default', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'New Team' });

    expect(res.status).toBe(201);
    expect(res.body.data.no_of_employees).toBe(0);
  });

  it('returns data.status as active when status is not sent because of schema default', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Default Status Dept' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
  });

  it('returns a data object with a populated _id field after creation', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'ID Check Dept' });

    expect(res.status).toBe(201);
    expect(res.body.data._id).toBeDefined();
    expect(typeof res.body.data._id).toBe('string');
  });

  it('returns 400 when name is missing because Mongoose ValidationError is handled', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ status: 'active', no_of_employees: 5 });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Department name is required');
  });

  it('persists the new department to the database so it is findable by _id', async () => {
    const res = await request(app)
      .post('/api/department/add')
      .send({ name: 'Persistence Check', no_of_employees: 3 });

    expect(res.status).toBe(201);

    const found = await department_model.findById(res.body.data._id);
    expect(found).not.toBeNull();
    expect(found.name).toBe('Persistence Check');
  });

  it('does not persist a department when name is missing', async () => {
    await request(app)
      .post('/api/department/add')
      .send({ no_of_employees: 10 });

    const count = await department_model.countDocuments();
    expect(count).toBe(0);
  });
});

// ─── POST /api/department/edit/:department_id ─────────────────────────────────

describe('POST /api/department/edit/:department_id', () => {
  it('returns 200 and data.name reflects the updated value', async () => {
    const dept = await create_department({ name: 'Before Edit' });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ name: 'After Edit' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Department updated successfully');
    expect(res.body.data.name).toBe('After Edit');
  });

  it('returns 200 and data.status reflects the updated enum value', async () => {
    const dept = await create_department({ name: 'Status Toggle', status: 'active' });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('returns 200 and data.no_of_employees reflects the updated numeric value', async () => {
    const dept = await create_department({ name: 'Headcount Update', no_of_employees: 5 });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ no_of_employees: 25 });

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(25);
  });

  it('does not overwrite existing name when a blank name is sent because sanitizePayload strips it', async () => {
    const dept = await create_department({ name: 'Original Name' });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ name: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Original Name');
  });

  it('returns 200 and persists the change to the database so re-fetch reflects the update', async () => {
    const dept = await create_department({ name: 'DB Persist Check', no_of_employees: 10 });

    await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ no_of_employees: 99 });

    const found = await department_model.findById(dept._id);
    expect(found.no_of_employees).toBe(99);
  });

  it('returns 200 and data._id matches the department_id used in the URL', async () => {
    const dept = await create_department({ name: 'ID Match Check' });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ name: 'ID Match Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(dept._id.toString());
  });

  it('returns 200 with all three fields updated when name, status, and no_of_employees are sent together', async () => {
    const dept = await create_department({ name: 'Multi Field Before', status: 'active', no_of_employees: 3 });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ name: 'Multi Field After', status: 'inactive', no_of_employees: 50 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Multi Field After');
    expect(res.body.data.status).toBe('inactive');
    expect(res.body.data.no_of_employees).toBe(50);
  });

  it('does not strip no_of_employees when updated value is 0 because sanitizePayload preserves falsy numbers', async () => {
    const dept = await create_department({ name: 'Zero Employees Test', no_of_employees: 10 });

    const res = await request(app)
      .post(`/api/department/edit/${dept._id}`)
      .send({ no_of_employees: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.no_of_employees).toBe(0);
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/department/edit/${unknown_id}`)
      .send({ name: 'Ghost Edit' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Department not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app)
      .post('/api/department/edit/not-a-valid-id')
      .send({ name: 'Bad ID Edit' });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while updating department');
  });
});

// ─── POST /api/department/delete/:department_id ───────────────────────────────

describe('POST /api/department/delete/:department_id', () => {
  it('returns 200 with status success and message Department deleted successfully', async () => {
    const dept = await create_department({ name: 'To Be Deleted' });

    const res = await request(app).post(`/api/department/delete/${dept._id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Department deleted successfully');
  });

  it('returns data containing the deleted document with the correct name', async () => {
    const dept = await create_department({ name: 'Returned On Delete' });

    const res = await request(app).post(`/api/department/delete/${dept._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Returned On Delete');
    expect(res.body.data._id).toBe(dept._id.toString());
  });

  it('removes the department from the database so a re-fetch returns null', async () => {
    const dept = await create_department({ name: 'Gone After Delete' });

    await request(app).post(`/api/department/delete/${dept._id}`);

    const found = await department_model.findById(dept._id);
    expect(found).toBeNull();
  });

  it('leaves other departments intact when only one is deleted', async () => {
    const dept_a = await create_department({ name: 'Delete Me' });
    const dept_b = await create_department({ name: 'Keep Me' });

    await request(app).post(`/api/department/delete/${dept_a._id}`);

    const remaining = await department_model.find();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Keep Me');
    expect(remaining[0]._id.toString()).toBe(dept_b._id.toString());
  });

  it('returns 404 for an unknown but structurally valid ObjectId', async () => {
    const unknown_id = new mongoose.Types.ObjectId();

    const res = await request(app).post(`/api/department/delete/${unknown_id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Department not found');
  });

  it('returns 500 for a malformed non-ObjectId path param', async () => {
    const res = await request(app).post('/api/department/delete/not-a-valid-id');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('An error occurred while deleting department');
  });

  it('does not decrement the total department count for other documents after a single deletion', async () => {
    await create_department({ name: 'Alpha' });
    await create_department({ name: 'Beta' });
    const dept_to_delete = await create_department({ name: 'Gamma' });

    await request(app).post(`/api/department/delete/${dept_to_delete._id}`);

    const count = await department_model.countDocuments();
    expect(count).toBe(2);
  });
});
