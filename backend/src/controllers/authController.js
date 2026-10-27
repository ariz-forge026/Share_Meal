import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { authCookieName, clearSessionCookies, createCsrfToken, jwtCookieMaxAge, setSessionCookies } from '../utils/cookies.js';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.role === 'ngo' ? { ngoProfile: user.ngoProfile } : {}),
    ...(user.role === 'donor' ? { donorProfile: user.donorProfile } : {}),
  };
}

function createToken(user) {
  if (!config.jwtSecret) throw new AppError(503, 'Authentication is not configured. Set JWT_SECRET in backend/.env.');
  return jwt.sign({ sub: user._id.toString(), ver: user.tokenVersion || 0 }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function register(request, response) {
  const { name, email, password, role, organizationName, address, city, description, donorType, businessName } = request.body;
  if (!config.jwtSecret) throw new AppError(503, 'Authentication is not configured. Set JWT_SECRET in backend/.env.');
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name, email, passwordHash, role,
    ...(role === 'ngo' ? { ngoProfile: { organizationName, address, city, description, verificationStatus: 'not_submitted' } } : {}),
    ...(role === 'donor' ? { donorProfile: { donorType: donorType || 'individual', businessName } } : {}),
  });
  const token = createToken(user);
  setSessionCookies(response, token, createCsrfToken(token), jwtCookieMaxAge());
  response.status(201).json({ success: true, user: publicUser(user) });
}

export async function login(request, response) {
  if (!config.jwtSecret) throw new AppError(503, 'Authentication is not configured. Set JWT_SECRET in backend/.env.');
  const user = await User.findOne({ email: request.body.email }).select('+passwordHash +tokenVersion');
  if (!user || user.accountStatus !== 'active' || !(await bcrypt.compare(request.body.password, user.passwordHash))) {
    throw new AppError(401, 'Email or password is incorrect.');
  }
  const token = createToken(user);
  setSessionCookies(response, token, createCsrfToken(token), jwtCookieMaxAge());
  response.json({ success: true, user: publicUser(user) });
}

export async function logout(request, response) {
  const token = request.cookies?.[authCookieName];
  clearSessionCookies(response);
  if (token && config.jwtSecret) {
    try {
      const claims = jwt.verify(token, config.jwtSecret);
      if (claims.sub) await User.updateOne({ _id: claims.sub, tokenVersion: claims.ver }, { $inc: { tokenVersion: 1 } });
    } catch (error) {
      if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') throw error;
    }
  }
  response.json({ success: true, message: 'You have been signed out.' });
}

export async function currentUser(request, response) {
  response.json({ success: true, user: publicUser(request.user) });
}

export async function changePassword(request, response) {
  const user = await User.findById(request.user._id).select('+passwordHash +tokenVersion');
  if (!(await bcrypt.compare(request.body.currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect.');
  }
  user.passwordHash = await bcrypt.hash(request.body.newPassword, 12);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  clearSessionCookies(response);
  response.json({ success: true, message: 'Password changed. Please sign in again.' });
}
