import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import AppError from './AppError.js';

export const authCookieName = 'sharemeal-session';
export const csrfCookieName = 'sharemeal-csrf';

export function createCsrfToken(sessionToken, secret = config.jwtSecret) {
  if (!secret) throw new AppError(503, 'Authentication is not configured. Set JWT_SECRET in backend/.env.');
  const nonce = randomBytes(32).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${sessionToken}.${nonce}`).digest('base64url');
  return `${nonce}.${signature}`;
}

export function verifyCsrfToken(token, sessionToken, secret = config.jwtSecret) {
  if (!secret || typeof token !== 'string' || typeof sessionToken !== 'string') return false;
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra !== undefined) return false;
  const expected = createHmac('sha256', secret).update(`${sessionToken}.${nonce}`).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (actual.toString('base64url') !== signature) return false;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function jwtCookieMaxAge() {
  const value = config.jwtExpiresIn;
  if (typeof value === 'number') return value * 1000;
  const match = /^(\d+)\s*(s|m|h|d|w)?$/i.exec(value);
  if (!match) return 24 * 60 * 60 * 1000;
  const factors = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return Number(match[1]) * factors[(match[2] || 's').toLowerCase()];
}

function commonOptions() {
  return {
    secure: config.nodeEnv === 'production',
    sameSite: config.cookieSameSite,
    path: '/',
  };
}

export function setSessionCookies(response, token, csrfToken, maxAge) {
  response.cookie(authCookieName, token, {
    ...commonOptions(),
    httpOnly: true,
    maxAge,
  });
  response.cookie(csrfCookieName, csrfToken, {
    ...commonOptions(),
    httpOnly: false,
    maxAge,
  });
}

export function clearSessionCookies(response) {
  response.clearCookie(authCookieName, { ...commonOptions(), httpOnly: true });
  response.clearCookie(csrfCookieName, { ...commonOptions(), httpOnly: false });
}
