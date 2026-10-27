import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { requireRole, requireVerifiedNgo } from '../src/middleware/authenticate.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint responds without a MongoDB connection', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.status, 'ok');
  assert.equal(data.database.connected, false);
  assert.equal(data.database.status, 'unavailable');
  assert.equal(typeof data.timestamp, 'string');
  assert.equal(JSON.stringify(data).includes('MONGODB_URI'), false);
});

test('database-backed listing reports a clear unavailable response', async () => {
  const response = await fetch(`${baseUrl}/api/donations`);
  const data = await response.json();
  assert.equal(response.status, 503);
  assert.match(data.message, /Configure MongoDB Atlas/);
});

test('unknown API routes return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  const data = await response.json();
  assert.equal(response.status, 404);
  assert.equal(data.success, false);
});

test('unverified NGO accounts cannot request donations', () => {
  let denied;
  requireVerifiedNgo({ user: { role: 'ngo', ngoProfile: { verified: false } } }, {}, (error) => { denied = error; });
  assert.equal(denied.statusCode, 403);
  assert.match(denied.message, /administrator-verified NGOs/);
});

test('verified NGO accounts pass the donation access gate', () => {
  let passed = false;
  requireVerifiedNgo({ user: { role: 'ngo', ngoProfile: { verificationStatus: 'approved' } } }, {}, (error) => { passed = !error; });
  assert.equal(passed, true);
});

test('only administrator accounts can pass the role guard', () => {
  let denied;
  requireRole('admin')({ user: { role: 'donor' } }, {}, (error) => { denied = error; });
  assert.equal(denied.statusCode, 403);
});
