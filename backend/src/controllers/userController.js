import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { parseCoordinates } from '../utils/location.js';
import { writeAudit } from '../services/auditService.js';

export async function getMyProfile(request, response) {
  const user = request.user;
  response.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.accountStatus,
      ...(user.donorProfile ? { donorProfile: user.donorProfile } : {}),
      ...(user.ngoProfile ? { ngoProfile: user.ngoProfile } : {}),
      ...(user.role === 'volunteer' ? { organization: user.organization } : {}),
    },
  });
}

export async function updateMyProfile(request, response) {
  const user = request.user;
  const { name, phone, donorType, businessName, address, city, latitude, longitude } = request.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (user.role === 'donor') {
    if (donorType !== undefined) user.donorProfile.donorType = donorType;
    if (businessName !== undefined) user.donorProfile.businessName = businessName;
    if (address !== undefined) user.donorProfile.address = address;
    if (city !== undefined) user.donorProfile.city = city;
    if (request.body.clearLocation) {
      user.donorProfile.location = undefined;
    } else if (latitude !== undefined || longitude !== undefined) {
      user.donorProfile.location = parseCoordinates({ lat: latitude, lng: longitude });
    }
  } else if (user.role === 'ngo') {
    if (address !== undefined) user.ngoProfile.address = address;
    if (city !== undefined) user.ngoProfile.city = city;
    if (request.body.clearLocation) {
      user.ngoProfile.location = undefined;
    } else if (latitude !== undefined || longitude !== undefined) {
      user.ngoProfile.location = parseCoordinates({ lat: latitude, lng: longitude });
    }
  }
  await user.save();
  await writeAudit(request, { action: 'user.profile_updated', resourceType: 'user', resourceId: user._id });
  return getMyProfile({ ...request, user }, response);
}

export async function listUsers(request, response) {
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
  const filter = {};
  if (request.query.role && ['donor', 'ngo', 'volunteer', 'admin'].includes(request.query.role)) filter.role = request.query.role;
  if (request.query.status && ['active', 'suspended', 'disabled'].includes(request.query.status)) filter.accountStatus = request.query.status;
  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone role accountStatus ngoProfile.organizationName ngoProfile.verificationStatus createdAt')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  response.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function updateUserStatus(request, response) {
  if (!['active', 'suspended', 'disabled'].includes(request.body.accountStatus)) {
    throw new AppError(400, 'Account status must be active, suspended or disabled.');
  }
  if (request.params.id === request.user._id.toString()) throw new AppError(400, 'You cannot change your own account status.');
  const user = await User.findByIdAndUpdate(request.params.id, {
    $set: { accountStatus: request.body.accountStatus },
    $inc: { tokenVersion: 1 },
  }, { new: true })
    .select('name email role accountStatus');
  if (!user) throw new AppError(404, 'User was not found.');
  await writeAudit(request, { action: 'admin.user_status_changed', resourceType: 'user', resourceId: user._id, details: { accountStatus: user.accountStatus } });
  response.json({ success: true, user });
}
