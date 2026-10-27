import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.js';
import { parseCoordinates, parseRadius } from '../utils/location.js';
import { writeAudit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';

export async function listVerifiedNgos(request, response) {
  const point = parseCoordinates(request.query);
  const radiusKm = parseRadius(request.query);
  const filter = { role: 'ngo', accountStatus: 'active', 'ngoProfile.verificationStatus': 'approved' };
  if (request.query.city) filter['ngoProfile.city'] = new RegExp(`^${request.query.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (request.query.category) {
    if (!['prepared', 'produce', 'packaged', 'bakery', 'other'].includes(request.query.category)) throw new AppError(400, 'Food category is invalid.');
    filter['ngoProfile.categoriesAccepted'] = request.query.category;
  }
  if (point) {
    const ngos = await User.aggregate([
      { $geoNear: { near: point, key: 'ngoProfile.location', distanceField: 'distanceMeters', maxDistance: radiusKm * 1000, spherical: true, query: filter } },
      { $limit: 100 },
      { $project: { name: 1, ngoProfile: { organizationName: 1, description: 1, city: 1, categoriesAccepted: 1, serviceRadiusKm: 1, verificationStatus: 1 }, distanceMeters: 1 } },
    ]);
    return response.json({ success: true, ngos, search: { radiusKm, geocodingAvailable: false } });
  }
  const ngos = await User.find(filter)
    .select('name ngoProfile.organizationName ngoProfile.description ngoProfile.city ngoProfile.categoriesAccepted ngoProfile.serviceRadiusKm ngoProfile.verificationStatus')
    .sort({ 'ngoProfile.organizationName': 1 }).limit(100);
  response.json({ success: true, ngos, search: { city: request.query.city || null, radiusKm: null, geocodingAvailable: false } });
}

export async function getNgoProfile(request, response) {
  const ngo = await User.findOne({ _id: request.params.id, role: 'ngo', accountStatus: 'active', 'ngoProfile.verificationStatus': 'approved' })
    .select('name ngoProfile.organizationName ngoProfile.description ngoProfile.city ngoProfile.categoriesAccepted ngoProfile.serviceRadiusKm ngoProfile.operatingHours ngoProfile.verificationStatus');
  if (!ngo) throw new AppError(404, 'Organization profile was not found.');
  response.json({ success: true, ngo });
}

export async function submitVerificationApplication(request, response) {
  const ngo = await User.findOne({ _id: request.user._id, role: 'ngo' });
  if (!ngo) throw new AppError(403, 'Only organization accounts can submit a verification application.');
  if (ngo.ngoProfile.verificationStatus === 'approved') throw new AppError(409, 'This organization is already approved.');
  const { legalName, registrationCategory, registrationNumber, address, city, contactPhone, description, categoriesAccepted, operatingHours, latitude, longitude, serviceRadiusKm } = request.body;
  ngo.ngoProfile.legalName = legalName;
  ngo.ngoProfile.registrationCategory = registrationCategory;
  ngo.ngoProfile.registrationNumber = registrationNumber || '';
  ngo.ngoProfile.address = address;
  ngo.ngoProfile.city = city;
  ngo.ngoProfile.contactPhone = contactPhone || '';
  ngo.ngoProfile.description = description;
  ngo.ngoProfile.categoriesAccepted = categoriesAccepted || [];
  ngo.ngoProfile.operatingHours = operatingHours || '';
  ngo.ngoProfile.serviceRadiusKm = serviceRadiusKm || 25;
  const point = parseCoordinates({ lat: latitude, lng: longitude });
  ngo.ngoProfile.location = point || undefined;
  ngo.ngoProfile.verificationStatus = 'pending';
  ngo.ngoProfile.verification.decisionNote = '';
  ngo.ngoProfile.verification.reviewedBy = null;
  ngo.ngoProfile.verification.reviewedAt = null;
  await ngo.save();
  await writeAudit(request, { action: 'ngo.verification_submitted', resourceType: 'ngo', resourceId: ngo._id });
  response.status(201).json({ success: true, ngo: { id: ngo._id, verificationStatus: ngo.ngoProfile.verificationStatus } });
}

export async function getMyNgoProfile(request, response) {
  if (request.user.role !== 'ngo') throw new AppError(403, 'Only NGO accounts have an organization profile.');
  const user = request.user;
  response.json({ success: true, profile: { ...user.ngoProfile.toObject(), id: user._id } });
}

export async function updateMyNgoProfile(request, response) {
  const ngo = request.user;
  if (ngo.role !== 'ngo') throw new AppError(403, 'Only NGO accounts can edit an organization profile.');
  const { description, contactPhone, categoriesAccepted, operatingHours, serviceRadiusKm } = request.body;
  if (description !== undefined) ngo.ngoProfile.description = description;
  if (contactPhone !== undefined) ngo.ngoProfile.contactPhone = contactPhone;
  if (categoriesAccepted !== undefined) ngo.ngoProfile.categoriesAccepted = categoriesAccepted;
  if (operatingHours !== undefined) ngo.ngoProfile.operatingHours = operatingHours;
  if (serviceRadiusKm !== undefined) ngo.ngoProfile.serviceRadiusKm = serviceRadiusKm;
  await ngo.save();
  await writeAudit(request, { action: 'ngo.profile_updated', resourceType: 'ngo', resourceId: ngo._id });
  response.json({ success: true, profile: ngo.ngoProfile });
}

export async function createVolunteer(request, response) {
  if (request.user.ngoProfile.verificationStatus !== 'approved') {
    throw new AppError(403, 'Only approved organizations can create volunteer accounts.');
  }
  const { name, email, password } = request.body;
  const existing = await User.exists({ email });
  if (existing) throw new AppError(409, 'An account with this email already exists.');
  const volunteer = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'volunteer',
    organization: request.user._id,
  });
  await writeAudit(request, { action: 'volunteer.created', resourceType: 'user', resourceId: volunteer._id, details: { organization: request.user._id } });
  response.status(201).json({ success: true, volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email, role: volunteer.role } });
}

export async function listVolunteers(request, response) {
  const volunteers = await User.find({ role: 'volunteer', organization: request.user._id, accountStatus: 'active' })
    .select('name email phone createdAt').sort({ name: 1 }).limit(100);
  response.json({ success: true, volunteers });
}
