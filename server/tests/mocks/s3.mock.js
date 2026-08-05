/**
 * tests/mocks/s3.mock.js
 *
 * Jest manual mock for `server/utils/s3.util.js`.
 *
 * Why this file exists:
 *   Controllers import S3 helpers directly and call them during request
 *   handling.  Without mocking, any integration test that hits a route
 *   with file-upload logic would attempt to connect to DigitalOcean
 *   Spaces, fail (no credentials in CI), and leave orphaned temp files
 *   on disk.  This mock eliminates all of that.
 *
 * How to use in a test file:
 *
 *   // At the top of your test file, before importing the app:
 *   import { jest } from '@jest/globals';
 *
 *   jest.unstable_mockModule('../../utils/s3.util.js', async () => {
 *     const { s3_mock } = await import('../mocks/s3.mock.js');
 *     return s3_mock;
 *   });
 *
 *   // Then import the app AFTER the mock is registered:
 *   const { default: app } = await import('../../app.js');
 *
 *   // Inspect calls in assertions:
 *   import { s3_mock } from '../mocks/s3.mock.js';
 *
 *   expect(s3_mock.upload_file_to_s3).toHaveBeenCalledTimes(1);
 *   expect(s3_mock.upload_file_to_s3).toHaveBeenCalledWith(
 *     expect.objectContaining({ fieldname: 'image' }),
 *     'workspace/ws-id/logo.png'
 *   );
 *
 *   // Reset call history between tests:
 *   beforeEach(() => {
 *     s3_mock.upload_file_to_s3.mockClear();
 *     s3_mock.delete_file_from_s3.mockClear();
 *     s3_mock.build_s3_key.mockClear();
 *     s3_mock.clear_temp_files.mockClear();
 *   });
 *
 * Mock behaviour:
 *   - upload_file_to_s3  → resolves with a fake { key, url } object so
 *     controllers can store and return the "uploaded" file's location.
 *   - delete_file_from_s3 → resolves with undefined (fire-and-forget).
 *   - build_s3_key       → returns a deterministic key string using the
 *     same joining logic as the real implementation.
 *   - clear_temp_files   → no-op (prevents fs.unlinkSync calls in tests).
 *   - safe_unlink        → no-op (same reason).
 */

import { jest } from '@jest/globals';

// ─── Individual mock functions ────────────────────────────────────────────────

/**
 * Mock for upload_file_to_s3(file, key).
 *
 * Returns a fake result that matches the shape controllers expect:
 *   { key: string, url: string }
 *
 * The `key` is echoed back from the argument so assertions can verify
 * the controller built the correct key before calling this function.
 */
const mock_upload_file_to_s3 = jest.fn().mockImplementation(async (file, key) => {
  return {
    key,
    url: `https://test-bucket.test-region.digitaloceanspaces.com/${key}`,
  };
});

/**
 * Mock for delete_file_from_s3(key).
 *
 * Silently resolves.  Controllers typically call this without checking
 * the return value, so undefined is the correct resolved value.
 */
const mock_delete_file_from_s3 = jest.fn().mockResolvedValue(undefined);

/**
 * Mock for build_s3_key(root, workspace_id, sub_folder, filename).
 *
 * Replicates the real join logic so the output is predictable in
 * assertions without coupling tests to the real implementation.
 */
const mock_build_s3_key = jest.fn().mockImplementation(
  (root, workspace_id, sub_folder, filename) => {
    const parts = [root, workspace_id, sub_folder, filename].filter(Boolean);
    return parts.join('/');
  }
);

/**
 * Mock for clear_temp_files(files).
 *
 * No-op.  Prevents the real implementation from calling fs.unlinkSync
 * on multer temp-file paths that don't exist during testing.
 */
const mock_clear_temp_files = jest.fn().mockImplementation(() => {});

/**
 * Mock for safe_unlink(file_path).
 *
 * No-op for the same reason as clear_temp_files.
 */
const mock_safe_unlink = jest.fn().mockImplementation(() => {});

// ─── Exported mock module ─────────────────────────────────────────────────────

/**
 * Drop-in replacement for the entire `utils/s3.util.js` module.
 *
 * Pass this object to jest.unstable_mockModule:
 *
 *   jest.unstable_mockModule('../../utils/s3.util.js', async () => {
 *     const { s3_mock } = await import('../mocks/s3.mock.js');
 *     return s3_mock;
 *   });
 */
export const s3_mock = {
  upload_file_to_s3: mock_upload_file_to_s3,
  delete_file_from_s3: mock_delete_file_from_s3,
  build_s3_key: mock_build_s3_key,
  clear_temp_files: mock_clear_temp_files,
  safe_unlink: mock_safe_unlink,
};

// ─── Reset helper ─────────────────────────────────────────────────────────────

/**
 * Clear call history on all S3 mock functions.
 *
 * Call this in a beforeEach block to prevent call-count bleed between
 * tests:
 *
 *   import { reset_s3_mocks } from '../mocks/s3.mock.js';
 *   beforeEach(() => reset_s3_mocks());
 */
export const reset_s3_mocks = () => {
  mock_upload_file_to_s3.mockClear();
  mock_delete_file_from_s3.mockClear();
  mock_build_s3_key.mockClear();
  mock_clear_temp_files.mockClear();
  mock_safe_unlink.mockClear();
};
