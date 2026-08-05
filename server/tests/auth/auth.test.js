/**
 * tests/auth/auth.test.js
 *
 * Integration tests for the auth module: POST /api/auth/signup,
 * POST /api/auth/signin, POST /api/auth/verify_token,
 * GET  /api/auth/logout, POST /api/auth/google,
 * POST /api/auth/update_user
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// ─── Mock external dependencies before any app import ────────────────────────
// jest.unstable_mockModule must be called before the dynamic import of app.js
// so that the module registry resolves the mocked versions when the controller
// module is loaded.

jest.unstable_mockModule('../../utils/cloudinary.js', () => ({
  uploadMediaToCloudinary: jest.fn().mockResolvedValue({
    secure_url: 'https://fake.cloudinary.com/test.jpg',
    public_id: 'test_public_id',
  }),
  deleteMediaFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.unstable_mockModule('../../utils/mailer.js', () => ({
  mailer: {
    sendMail: jest.fn().mockImplementation((opts, cb) => {
      if (cb) cb(null, {});
    }),
  },
}));

// ─── Deferred imports (must happen after mock registration) ──────────────────

let app;
let uploadMediaToCloudinary;
let deleteMediaFromCloudinary;
let mailer_mock;

import request from 'supertest';
import {
  create_user,
  TEST_PASSWORD,
} from '../helpers/factories.js';
import {
  get_auth_cookie,
  get_invalid_token_cookie,
  get_empty_cookie,
} from '../helpers/auth.helper.js';
import user_model from '../../models/user.model.js';
import user_verification_model from '../../models/user_verification.model.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_auth_tests';

  const app_module = await import('../../app.js');
  app = app_module.app;

  const cloudinary_module = await import('../../utils/cloudinary.js');
  uploadMediaToCloudinary = cloudinary_module.uploadMediaToCloudinary;
  deleteMediaFromCloudinary = cloudinary_module.deleteMediaFromCloudinary;

  const mailer_module = await import('../../utils/mailer.js');
  mailer_mock = mailer_module.mailer;
});

beforeEach(async () => {
  jest.clearAllMocks();
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  const build_valid_payload = () => ({
    user_name: 'Test Signup User',
    user_email: 'signup@example.com',
    user_password: 'ValidPass123',
  });

  it('returns 200 and status success with a valid body', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(build_valid_payload());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Please check your email for verification.');
  });

  it('returns 400 when user_name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_email: 'test@example.com', user_password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'Test', user_password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'Test', user_email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when user_email has an invalid format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'Test', user_email: 'notanemail', user_password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when the email already exists', async () => {
    await request(app).post('/api/auth/signup').send(build_valid_payload());

    const res = await request(app)
      .post('/api/auth/signup')
      .send(build_valid_payload());

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('does not return user_password in the response', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(build_valid_payload());

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user_password).toBeUndefined();
  });

  it('creates a user_verification document after signup', async () => {
    await request(app).post('/api/auth/signup').send(build_valid_payload());

    const verifications = await user_verification_model.find({});
    expect(verifications.length).toBe(1);
    expect(verifications[0].user_verification_token).toBeDefined();
  });

  it('calls mailer.sendMail after signup', async () => {
    await request(app).post('/api/auth/signup').send(build_valid_payload());

    expect(mailer_mock.sendMail).toHaveBeenCalledTimes(1);
    const call_args = mailer_mock.sendMail.mock.calls[0][0];
    expect(call_args.to).toBe(build_valid_payload().user_email);
  });
});

// ─── POST /api/auth/signin ────────────────────────────────────────────────────

describe('POST /api/auth/signin', () => {
  it('returns 200 and sets user_token cookie for a valid verified user', async () => {
    const user = await create_user({ user_email: 'signin@example.com' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const set_cookie = res.headers['set-cookie'];
    expect(set_cookie).toBeDefined();
    expect(set_cookie.some((c) => c.startsWith('user_token='))).toBe(true);
  });

  it('returns 400 when the email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: 'nobody@example.com', user_password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when the password is wrong', async () => {
    const user = await create_user({ user_email: 'wrongpass@example.com' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: 'WrongPassword999' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when the user exists but email is not verified', async () => {
    const user = await create_user({
      user_email: 'unverified@example.com',
      user_email_verified: false,
    });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('does not return user_password in the signin response', async () => {
    const user = await create_user({ user_email: 'nopwd@example.com' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user_password).toBeUndefined();
  });

  it('sets a long-lived cookie when remember is true', async () => {
    const user = await create_user({ user_email: 'remember@example.com' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: TEST_PASSWORD, remember: true });

    expect(res.status).toBe(200);
    const set_cookie = res.headers['set-cookie'];
    const token_cookie = set_cookie.find((c) => c.startsWith('user_token='));
    // 30-day Max-Age
    expect(token_cookie).toMatch(/Max-Age=2592000/i);
  });

  it('sets a short-lived cookie when remember is false or omitted', async () => {
    const user = await create_user({ user_email: 'noremember@example.com' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ user_email: user.user_email, user_password: TEST_PASSWORD, remember: false });

    expect(res.status).toBe(200);
    const set_cookie = res.headers['set-cookie'];
    const token_cookie = set_cookie.find((c) => c.startsWith('user_token='));
    // 1-day Max-Age
    expect(token_cookie).toMatch(/Max-Age=86400/i);
  });
});

// ─── POST /api/auth/verify_token ─────────────────────────────────────────────

describe('POST /api/auth/verify_token', () => {
  it('returns 200 and status success when cookie has a valid JWT for an existing user', async () => {
    const user = await create_user({ user_email: 'verify@example.com' });
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/auth/verify_token')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    const set_cookie = res.headers['set-cookie'];
    expect(set_cookie).toBeDefined();
    expect(set_cookie.some((c) => c.startsWith('user_token='))).toBe(true);
  });

  it('returns 401 when cookie has an invalid JWT', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/auth/verify_token')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when cookie is empty', async () => {
    const cookie = get_empty_cookie();

    const res = await request(app)
      .post('/api/auth/verify_token')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── GET /api/auth/logout ─────────────────────────────────────────────────────

describe('GET /api/auth/logout', () => {
  it('returns 200 and status success', async () => {
    const res = await request(app).get('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('clears the user_token cookie in the response', async () => {
    const res = await request(app).get('/api/auth/logout');

    const set_cookie = res.headers['set-cookie'];
    expect(set_cookie).toBeDefined();

    const token_cookie = set_cookie.find((c) => c.startsWith('user_token='));
    expect(token_cookie).toBeDefined();
    // A cleared cookie is sent with an empty value and/or Expires in the past
    expect(token_cookie).toMatch(/user_token=;|user_token=(?:;| )/);
  });
});

// ─── POST /api/auth/google ────────────────────────────────────────────────────

describe('POST /api/auth/google', () => {
  const google_user_info = {
    email: 'googleuser@gmail.com',
    name: 'Google User',
    picture: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  const mock_token_ok_response = () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return {
          ok: true,
          json: async () => ({ access_token: 'fake_access_token' }),
        };
      }
      if (url.includes('googleapis.com/oauth2/v1/userinfo')) {
        return {
          ok: true,
          json: async () => google_user_info,
        };
      }
    });
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when the Google token exchange returns a non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ code: 'bad_code', redirect_base_url: 'http://localhost:3000' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and sets cookie when Google returns valid info for an existing user', async () => {
    await create_user({ user_email: google_user_info.email });
    mock_token_ok_response();

    const res = await request(app)
      .post('/api/auth/google')
      .send({ code: 'valid_code', redirect_base_url: 'http://localhost:3000' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const set_cookie = res.headers['set-cookie'];
    expect(set_cookie).toBeDefined();
    expect(set_cookie.some((c) => c.startsWith('user_token='))).toBe(true);
  });

  it('returns 200 and sets cookie when Google returns valid info for a brand-new user', async () => {
    mock_token_ok_response();

    const res = await request(app)
      .post('/api/auth/google')
      .send({ code: 'valid_code', redirect_base_url: 'http://localhost:3000' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const set_cookie = res.headers['set-cookie'];
    expect(set_cookie).toBeDefined();
    expect(set_cookie.some((c) => c.startsWith('user_token='))).toBe(true);

    const created = await user_model.findOne({ user_email: google_user_info.email });
    expect(created).not.toBeNull();
    expect(created.user_email_verified).toBe(true);
  });
});

// ─── POST /api/auth/update_user ───────────────────────────────────────────────

describe('POST /api/auth/update_user', () => {
  it('returns 200 with updated user_name when token and body are valid', async () => {
    const user = await create_user({ user_email: 'update@example.com' });
    const cookie = get_auth_cookie(user);

    const res = await request(app)
      .post('/api/auth/update_user')
      .set('Cookie', [cookie])
      .send({ user_name: 'New Display Name' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user_name).toBe('New Display Name');
  });

  it('returns 401 when the JWT is invalid', async () => {
    const cookie = get_invalid_token_cookie();

    const res = await request(app)
      .post('/api/auth/update_user')
      .set('Cookie', [cookie])
      .send({ user_name: 'Wont Matter' });

    // Controller gap: jwt.verify() throws JsonWebTokenError which is caught by the
    // generic catch block and returned as 500. Fix: wrap jwt.verify in its own
    // try/catch and return 401 on JsonWebTokenError / TokenExpiredError.
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 401 when the token is valid but the user does not exist in the DB', async () => {
    // Sign a token for an ObjectId that has no corresponding user document.
    const ghost_user = { _id: new mongoose.Types.ObjectId() };
    const cookie = get_auth_cookie(ghost_user);

    const res = await request(app)
      .post('/api/auth/update_user')
      .set('Cookie', [cookie])
      .send({ user_name: 'Ghost' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('calls deleteMediaFromCloudinary once when remove_user_image is true and user has an existing image', async () => {
    const user = await create_user({ user_email: 'removeimg@example.com' });
    const cookie = get_auth_cookie(user);

    // Write user_image and user_image_public_id directly to the raw collection so the
    // DB document has these values. The controller reads existing_user.user_image from
    // the Mongoose document returned by findById — this will only be present once
    // user_image and user_image_public_id are added to the user_model schema.
    // Schema gap: Mongoose strict mode strips these fields on findById because they are
    // not declared in the schema, so existing_user.user_image is always undefined and
    // deleteMediaFromCloudinary is never called.
    // Fix required: add `user_image: String` and `user_image_public_id: String` to user_model.
    await mongoose.connection.collections['users'].updateOne(
      { _id: user._id },
      { $set: { user_image: 'https://fake.cloudinary.com/old.jpg', user_image_public_id: 'old_public_id' } }
    );

    const raw = await mongoose.connection.collections['users'].findOne({ _id: user._id });
    expect(raw.user_image).toBe('https://fake.cloudinary.com/old.jpg');

    const res = await request(app)
      .post('/api/auth/update_user')
      .set('Cookie', [cookie])
      .send({ user_name: user.user_name, remove_user_image: 'true' });

    expect(res.status).toBe(200);
    expect(deleteMediaFromCloudinary).toHaveBeenCalledTimes(1);
  });

  it('returns 200 and calls uploadMediaToCloudinary when a file is attached', async () => {
    const user = await create_user({ user_email: 'upload@example.com' });
    const cookie = get_auth_cookie(user);

    // Minimal valid 1x1 PNG
    const png_buffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
      '2e00000000c4944415478016360f8cfc00000000200016b2c0fc0000000049454e44ae426082',
      'hex'
    );

    const res = await request(app)
      .post('/api/auth/update_user')
      .set('Cookie', [cookie])
      .field('user_name', 'Upload User')
      .attach('new_user_image', png_buffer, { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(uploadMediaToCloudinary).toHaveBeenCalledTimes(1);
  });
});
