import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { authCookieName } from '../utils/cookies.js';

export const authenticate = asyncHandler(async (request, response, next) => {
  const authorization = request.get('authorization');
  const token = request.cookies?.[authCookieName] || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);
  if (!token) throw new AppError(401, 'Please sign in to continue.');
  if (!config.jwtSecret) throw new AppError(503, 'Authentication is not configured. Set JWT_SECRET in backend/.env.');

  let claims;
  try {
    claims = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  const user = await User.findById(claims.sub).select('+tokenVersion');
  if (!user) throw new AppError(401, 'Your account could not be found. Please sign in again.');
  if (claims.ver !== (user.tokenVersion || 0)) throw new AppError(401, 'Your session has ended. Please sign in again.');
  if (user.accountStatus !== 'active') throw new AppError(403, 'This account has been suspended or disabled.');
  request.user = user;
  next();
});

export function requireRole(...roles) {
  return function roleGuard(request, response, next) {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}

export function requireVerifiedNgo(request, response, next) {
  if (request.user?.role !== 'ngo' || request.user.ngoProfile?.verificationStatus !== 'approved') {
    return next(new AppError(403, 'Only administrator-verified NGOs can request or collect donations.'));
  }
  return next();
}
