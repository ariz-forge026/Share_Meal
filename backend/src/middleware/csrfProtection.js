import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { authCookieName, csrfCookieName, verifyCsrfToken } from '../utils/cookies.js';
import AppError from '../utils/AppError.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function equalTokens(first, second) {
  if (!first || !second) return false;
  const left = Buffer.from(first);
  const right = Buffer.from(second);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function csrfProtection(request, response, next, secret = config.jwtSecret) {
  if (safeMethods.has(request.method) || !request.cookies?.[authCookieName]) return next();

  const origin = request.get('origin');
  if (origin !== config.frontendUrl) return next(new AppError(403, 'Request origin is not allowed.'));
  const csrfToken = request.cookies[csrfCookieName];
  if (!equalTokens(csrfToken, request.get('x-csrf-token')) || !verifyCsrfToken(csrfToken, request.cookies[authCookieName], secret)) {
    return next(new AppError(403, 'Your security token is missing or expired. Refresh the page and try again.'));
  }
  return next();
}
