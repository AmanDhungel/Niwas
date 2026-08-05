/**
 * tests/setup.js
 *
 * Global test setup for the Express MRC API.
 *
 * Responsibilities:
 *   - Spin up an isolated in-memory MongoDB via mongodb-memory-server.
 *   - Connect Mongoose to that server so all real models work without
 *     touching the production database.
 *   - Expose a `db` helper with a `clear(collectionName)` method so
 *     individual test files can wipe only the collections they own
 *     between tests, keeping suites independent.
 *   - Tear everything down cleanly after the full run.
 *
 * Usage in a test file:
 *
 *   import { db } from '../setup.js';
 *
 *   beforeEach(async () => {
 *     await db.clear('users');
 *     await db.clear('domain_workspaces');
 *   });
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo_server;

/**
 * Utility object shared across all test files.
 *
 * db.clear(collectionName) — drops every document in the named
 * collection so the next test starts with a clean slate.
 *
 * db.clearAll() — drops ALL collections.  Useful in top-level
 * afterEach hooks when a test suite touches many models.
 */
export const db = {
  /**
   * Remove all documents from a single named collection.
   *
   * @param {string} collection_name  The MongoDB collection name
   *   (matches the first argument to mongoose.model()).
   *   Examples: 'users', 'domain_workspaces', 'permission_policies'
   */
  async clear(collection_name) {
    const collection = mongoose.connection.collections[collection_name];
    if (collection) {
      await collection.deleteMany({});
    }
  },

  /**
   * Remove all documents from every collection in the in-memory
   * database.  Use this when your test touches many models and you
   * want a guaranteed blank slate without listing each one.
   */
  async clearAll() {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((c) => c.deleteMany({})));
  },
};

// ─── Lifecycle hooks ────────────────────────────────────────────────────────

/**
 * Start the in-memory server and connect Mongoose to it before any
 * test in the suite runs.  Using a single server for the full run is
 * faster than starting one per-describe block.
 */
beforeAll(async () => {
  mongo_server = await MongoMemoryServer.create();
  const uri = mongo_server.getUri();

  await mongoose.connect(uri, {
    // mongodb-memory-server does not require a dbName, but specifying
    // one makes connection strings predictable during debugging.
    dbName: 'test_db',
  });
});

/**
 * Disconnect Mongoose and stop the in-memory server after the last
 * test so the process can exit cleanly (no open handles).
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongo_server.stop();
});

/**
 * Clear every collection between tests by default.
 *
 * This is the safest global default: each test begins with an empty
 * database.  Individual test files may override this by calling
 * db.clear('specific_collection') in their own beforeEach if they need
 * fine-grained control.
 */
beforeEach(async () => {
  await db.clearAll();
});
