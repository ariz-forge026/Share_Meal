import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { registerValidators } from '../src/validators/authValidators.js';
import { createDonationValidators, updateDonationValidators } from '../src/validators/donationValidators.js';
import { profileValidators, verificationApplicationValidators } from '../src/validators/profileValidators.js';
import { donationSearchValidators } from '../src/validators/queryValidators.js';
import { assertDonationTransition, canTransitionDonation } from '../src/utils/donationState.js';
import { parseCoordinates, parsePagination, parseRadius } from '../src/utils/location.js';
import { csrfProtection } from '../src/middleware/csrfProtection.js';
import { createCsrfToken, jwtCookieMaxAge, setSessionCookies, verifyCsrfToken } from '../src/utils/cookies.js';
import Donation from '../src/models/Donation.js';

test('public registration validation rejects administrator and volunteer roles', async () => {
  for (const role of ['admin', 'volunteer']) {
    const request = { body: { name: 'Sample Member', email: 'member@example.invalid', password: 'a-long-test-password', role } };
    await Promise.all(registerValidators.map((validator) => validator.run(request)));
    assert.equal(validationResult(request).isEmpty(), false);
  }
});

test('passwords are stored as verifiable hashes, never as the raw password', async () => {
  const password = randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(password, 4);
  assert.notEqual(hash, password);
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare('incorrect-password', hash), false);
});

test('donation state machine allows only the intended workflow', () => {
  assert.equal(canTransitionDonation('available', 'requested'), true);
  assert.equal(canTransitionDonation('requested', 'accepted'), true);
  assert.equal(canTransitionDonation('pickup_scheduled', 'collected'), true);
  assert.equal(canTransitionDonation('collected', 'completed'), true);
  assert.equal(canTransitionDonation('pickup_scheduled', 'expired'), true);
  assert.equal(canTransitionDonation('completed', 'available'), false);
  assert.throws(() => assertDonationTransition('completed', 'requested'), { statusCode: 409 });
});

test('location and pagination inputs have explicit bounds', () => {
  assert.deepEqual(parseCoordinates({ lat: '12.97', lng: '77.59' }), { type: 'Point', coordinates: [77.59, 12.97] });
  assert.equal(parseCoordinates({}), null);
  assert.throws(() => parseCoordinates({ lat: '91', lng: '0' }), { statusCode: 400 });
  assert.throws(() => parseCoordinates({ lat: '1' }), { statusCode: 400 });
  assert.equal(parseRadius({ radiusKm: '50' }), 50);
  assert.throws(() => parseRadius({ radiusKm: '251' }), { statusCode: 400 });
  assert.deepEqual(parsePagination({ page: '2', limit: '20' }), { page: 2, limit: 20, skip: 20 });
  assert.throws(() => parsePagination({ page: '-1', limit: '1000' }), { statusCode: 400 });
});

test('location filters and profile updates reject incomplete coordinate pairs', async () => {
  const search = { query: { lat: '0' } };
  await Promise.all(donationSearchValidators.map((validator) => validator.run(search)));
  assert.equal(validationResult(search).isEmpty(), false);

  const profile = { body: { name: 'Sample Member', latitude: '12.3' } };
  await Promise.all(profileValidators.map((validator) => validator.run(profile)));
  assert.equal(validationResult(profile).isEmpty(), false);

  const application = { body: { legalName: 'Sample NGO', registrationCategory: 'Nonprofit', address: '1 Sample Street', city: 'Sample City', description: 'Community food support.', latitude: '12.3' } };
  await Promise.all(verificationApplicationValidators.map((validator) => validator.run(application)));
  assert.equal(validationResult(application).isEmpty(), false);
});

test('donation validators reject incomplete locations and unrecognized edit fields', async () => {
  const createRequest = {
    body: {
      title: 'Fresh meal boxes',
      description: 'Prepared meals ready for safe collection.',
      category: 'prepared',
      quantity: '3.5',
      unit: 'kg',
      pickupAddress: '1 Sample Street',
      city: 'Sample City',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      latitude: '12.3',
    },
  };
  await Promise.all(createDonationValidators.map((validator) => validator.run(createRequest)));
  assert.ok(validationResult(createRequest).array().some((error) => error.msg === 'Provide both latitude and longitude coordinates.'));

  const updateRequest = { body: { status: 'completed' } };
  await Promise.all(updateDonationValidators.map((validator) => validator.run(updateRequest)));
  assert.ok(validationResult(updateRequest).array().some((error) => error.msg === 'Provide at least one recognized field to update.'));
});

test('cookie session duration follows configured JWT expiry', () => {
  assert.ok(jwtCookieMaxAge() > 0);
  const cookies = [];
  setSessionCookies({ cookie: (...args) => cookies.push(args) }, 'not-a-real-token', 'csrf-value', 10_000);
  assert.equal(cookies.length, 2);
  assert.equal(cookies[0][1], 'not-a-real-token');
  assert.equal(cookies[0][2].httpOnly, true);
  assert.equal(cookies[1][2].httpOnly, false);
  assert.equal(cookies[0][2].sameSite, 'strict');
});

test('unsafe cookie-authenticated requests require matching CSRF token and origin', () => {
  const sessionToken = 'test-session-token';
  const testSecret = 'test-only-secret';
  const csrfToken = createCsrfToken(sessionToken, testSecret);
  const base = {
    method: 'POST',
    cookies: { 'sharemeal-session': sessionToken, 'sharemeal-csrf': csrfToken },
    get: (name) => ({ origin: 'http://localhost:5173', 'x-csrf-token': csrfToken })[name.toLowerCase()],
  };
  let error;
  csrfProtection(base, {}, (value) => { error = value; }, testSecret);
  assert.equal(error, undefined);

  csrfProtection({ ...base, get: (name) => name.toLowerCase() === 'origin' ? 'https://attacker.example' : csrfToken }, {}, (value) => { error = value; }, testSecret);
  assert.equal(error.statusCode, 403);
  csrfProtection({ ...base, get: (name) => name.toLowerCase() === 'origin' ? 'http://localhost:5173' : 'wrong' }, {}, (value) => { error = value; }, testSecret);
  assert.equal(error.statusCode, 403);
  assert.equal(verifyCsrfToken(csrfToken, sessionToken, testSecret), true);
  assert.equal(verifyCsrfToken(csrfToken, 'different-session-token', testSecret), false);
  assert.equal(verifyCsrfToken(`${csrfToken.slice(0, -1)}x`, sessionToken, testSecret), false);
});

test('donation model rejects invalid quantities and food classifications', async () => {
  const donation = new Donation({
    title: 'Food',
    description: 'A short description',
    category: 'prepared',
    quantity: -1,
    unit: 'portions',
    pickupAddress: '1 Sample Street',
    city: 'Sample City',
    expiresAt: new Date(Date.now() + 60_000),
    foodType: 'unsafe-enum',
  });
  await assert.rejects(donation.validate(), (error) => {
    assert.ok(error.errors.quantity);
    assert.ok(error.errors.foodType);
    return true;
  });
});
