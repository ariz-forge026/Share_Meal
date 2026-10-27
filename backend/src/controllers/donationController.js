import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
import AppError from '../utils/AppError.js';
import { parseCoordinates, parsePagination, parseRadius } from '../utils/location.js';
import { notify } from '../services/notificationService.js';
import { writeAudit } from '../services/auditService.js';
import { assertDonationTransition } from '../utils/donationState.js';

const publicFields = 'title description category quantity unit peopleServedEstimate foodType preparedAt useBy storageRequirements allergens packagingCondition city expiresAt status donor createdAt';

function isAssignedNgo(donation, userId) {
  return donation.assignedNgo?.toString() === userId.toString();
}

function escapedRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addHistory(donation, status, userId, note = '') {
  assertDonationTransition(donation.status, status);
  donation.status = status;
  donation.history.push({ status, changedBy: userId, note });
}

function toPoint(body) {
  if (body.latitude === undefined && body.longitude === undefined) return undefined;
  const point = parseCoordinates({ lat: body.latitude, lng: body.longitude });
  return point || undefined;
}

export async function listDonations(request, response) {
  const { page, limit, skip } = parsePagination(request.query);
  const point = parseCoordinates(request.query);
  const radiusKm = parseRadius(request.query);
  const filter = { status: 'available', expiresAt: { $gt: new Date() } };
  if (request.query.category) filter.category = request.query.category;
  if (request.query.foodType) filter.foodType = request.query.foodType;
  if (request.query.city) filter.city = new RegExp(`^${escapedRegex(request.query.city.trim())}$`, 'i');
  if (request.query.before) {
    const before = new Date(request.query.before);
    if (Number.isNaN(before.getTime())) throw new AppError(400, 'before must be a valid date.');
    filter.expiresAt.$lte = before;
  }
  if (request.query.search) {
    const search = escapedRegex(request.query.search.trim().slice(0, 100));
    filter.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { city: new RegExp(search, 'i') }];
  }
  const allowedSorts = {
    newest: { createdAt: -1 },
    deadline: { expiresAt: 1 },
    distance: { distanceMeters: 1 },
  };
  const sort = allowedSorts[request.query.sort || 'newest'];
  if (!sort) throw new AppError(400, 'sort must be newest, deadline or distance.');
  if (sort === allowedSorts.distance && !point) throw new AppError(400, 'Distance sorting requires valid lat and lng coordinates.');

  let donations;
  let total;
  if (point) {
    const withinRadius = { $geoWithin: { $centerSphere: [point.coordinates, radiusKm / 6378.1] } };
    const nearbyFilter = { ...filter, pickupLocation: withinRadius };
    const pipeline = [
      { $geoNear: { near: point, key: 'pickupLocation', distanceField: 'distanceMeters', maxDistance: radiusKm * 1000, spherical: true, query: filter } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'donor', foreignField: '_id', pipeline: [{ $project: { name: 1 } }], as: 'donorProfile' } },
      { $unwind: { path: '$donorProfile', preserveNullAndEmptyArrays: true } },
      { $project: { title: 1, description: 1, category: 1, quantity: 1, unit: 1, peopleServedEstimate: 1, foodType: 1, preparedAt: 1, useBy: 1, storageRequirements: 1, allergens: 1, packagingCondition: 1, city: 1, expiresAt: 1, status: 1, createdAt: 1, distanceKm: { $divide: ['$distanceMeters', 1000] }, donor: { name: '$donorProfile.name' } } },
    ];
    [donations, total] = await Promise.all([
      Donation.aggregate(pipeline),
      Donation.countDocuments({ ...filter, ...nearbyFilter }),
    ]);
  } else {
    [donations, total] = await Promise.all([
      Donation.find(filter).select(publicFields).sort(sort).skip(skip).limit(limit).populate('donor', 'name'),
      Donation.countDocuments(filter),
    ]);
  }
  response.json({ success: true, donations, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, locationSearch: point ? { radiusKm } : null });
}

export async function getDonation(request, response) {
  const donation = await Donation.findById(request.params.id)
    .select(`${publicFields} pickupAddress donor history requestedBy assignedNgo distributionNote`)
    .populate('donor', 'name')
    .populate('assignedNgo', 'name ngoProfile.organizationName');
  if (!donation || (['available', 'requested', 'accepted', 'pickup_scheduled'].includes(donation.status) && donation.expiresAt <= new Date())) {
    throw new AppError(404, 'Donation was not found or is no longer available.');
  }
  const canActAsNgo = request.user?.role === 'ngo' && request.user.ngoProfile?.verificationStatus === 'approved';
  const hasRequest = canActAsNgo && await DonationRequest.exists({
    donation: donation._id,
    ngo: request.user._id,
    status: { $in: ['pending', 'accepted'] },
  });
  const canViewPickup = request.user && (
    donation.donor._id?.toString() === request.user._id.toString()
    || (canActAsNgo && isAssignedNgo(donation, request.user._id))
    || Boolean(hasRequest)
  );
  const result = donation.toObject();
  if (!canViewPickup) {
    delete result.pickupAddress;
    delete result.history;
    delete result.requestedBy;
    delete result.assignedNgo;
    delete result.distributionNote;
  }
  response.json({ success: true, donation: result });
}

export async function listMyDonations(request, response) {
  if (request.user.role === 'ngo' && request.user.ngoProfile?.verificationStatus !== 'approved') {
    throw new AppError(403, 'Only administrator-approved NGOs can view their donation handoffs.');
  }
  const { page, limit, skip } = parsePagination(request.query);
  const ownerQuery = request.user.role === 'donor'
    ? { donor: request.user._id }
    : request.user.role === 'ngo'
      ? { $or: [{ assignedNgo: request.user._id }, { requestedBy: request.user._id }] }
      : { donor: request.user._id };
  const filter = { ...ownerQuery };
  if (request.query.status) filter.status = request.query.status;
  const [donations, total] = await Promise.all([
    Donation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)
      .populate('donor', 'name').populate('assignedNgo', 'name ngoProfile.organizationName')
      .populate('requestedBy', 'name ngoProfile.organizationName'),
    Donation.countDocuments(filter),
  ]);
  response.json({ success: true, donations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function listNearbyDonations(request, response) {
  const point = parseCoordinates(request.query);
  if (!point) throw new AppError(400, 'Enter coordinates or allow browser location to search nearby donations.');
  return listDonations(request, response);
}

export async function createDonation(request, response) {
  const pickupLocation = toPoint(request.body);
  const {
    title, description, category, quantity, unit, peopleServedEstimate, foodType,
    preparedAt, useBy, storageRequirements, allergens, packagingCondition,
    handlingInstructions, pickupAddress, city, expiresAt,
  } = request.body;
  const expiresDate = new Date(expiresAt);
  if (expiresDate <= new Date()) throw new AppError(400, 'Collection deadline must be in the future.');
  if (useBy && new Date(useBy) < expiresDate) throw new AppError(400, 'Use-by time cannot be earlier than the collection deadline.');
  if (preparedAt && new Date(preparedAt) > new Date()) throw new AppError(400, 'Preparation time cannot be in the future.');
  const donation = await Donation.create({
    title, description, category, quantity, unit, peopleServedEstimate, foodType,
    preparedAt, useBy, storageRequirements, allergens, packagingCondition,
    handlingInstructions, pickupAddress, city, expiresAt: expiresDate, pickupLocation,
    donor: request.user._id,
    history: [{ status: 'available', changedBy: request.user._id, note: 'Listing created.' }],
  });
  await writeAudit(request, { action: 'donation.created', resourceType: 'donation', resourceId: donation._id });
  response.status(201).json({ success: true, donation });
}

export async function updateDonation(request, response) {
  const donation = await Donation.findOne({ _id: request.params.id, donor: request.user._id });
  if (!donation) throw new AppError(404, 'Donation was not found.');
  if (donation.status !== 'available') throw new AppError(409, 'Only available donations can be edited.');
  const allowed = ['title', 'description', 'category', 'quantity', 'unit', 'peopleServedEstimate', 'foodType', 'preparedAt', 'useBy', 'storageRequirements', 'allergens', 'packagingCondition', 'handlingInstructions', 'pickupAddress', 'city', 'expiresAt'];
  for (const field of allowed) {
    if (request.body[field] !== undefined) donation[field] = request.body[field];
  }
  const updates = {};
  for (const field of allowed) {
    if (request.body[field] !== undefined) updates[field] = request.body[field];
  }
  if (request.body.latitude !== undefined || request.body.longitude !== undefined) {
    donation.pickupLocation = toPoint(request.body);
    updates.pickupLocation = donation.pickupLocation;
  }
  if (donation.expiresAt <= new Date()) throw new AppError(400, 'Collection deadline must be in the future.');
  if (donation.preparedAt && donation.preparedAt > new Date()) throw new AppError(400, 'Preparation time cannot be in the future.');
  if (donation.useBy && donation.useBy < donation.expiresAt) throw new AppError(400, 'Use-by time cannot be earlier than the collection deadline.');
  const updatedDonation = await Donation.findOneAndUpdate(
    { _id: donation._id, donor: request.user._id, status: 'available', expiresAt: { $gt: new Date() } },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!updatedDonation) throw new AppError(409, 'This listing changed state and can no longer be edited.');
  await writeAudit(request, { action: 'donation.updated', resourceType: 'donation', resourceId: donation._id });
  response.json({ success: true, donation: updatedDonation });
}

export async function deleteDonation(request, response) {
  const donation = await Donation.findOne({ _id: request.params.id, donor: request.user._id });
  if (!donation) throw new AppError(404, 'Donation was not found.');
  if (donation.status !== 'available') {
    throw new AppError(409, 'Only an unrequested available donation can be deleted. Cancelled or requested records are retained for audit history.');
  }
  if (await DonationRequest.exists({ donation: donation._id })) throw new AppError(409, 'A donation with request history cannot be deleted; cancel it instead.');
  await donation.deleteOne();
  await writeAudit(request, { action: 'donation.deleted', resourceType: 'donation', resourceId: donation._id });
  response.json({ success: true, message: 'Donation deleted.' });
}

export async function requestDonation(request, response) {
  const donation = await Donation.findOne({ _id: request.params.id, status: 'available', expiresAt: { $gt: new Date() } });
  if (!donation) throw new AppError(409, 'This listing is no longer available or its pickup deadline has passed.');
  assertDonationTransition(donation.status, 'requested');
  const requestRecord = await DonationRequest.create({
    donation: donation._id,
    ngo: request.user._id,
    message: request.body.message || '',
  });
  const updated = await Donation.findOneAndUpdate(
    { _id: donation._id, status: 'available', expiresAt: { $gt: new Date() } },
    {
      $set: { status: 'requested', requestedBy: request.user._id, activeRequest: requestRecord._id },
      $push: { history: { status: 'requested', changedBy: request.user._id, note: 'A verified NGO requested the listing.' } },
    },
    { new: true, runValidators: true },
  );
  if (!updated) {
    await DonationRequest.deleteOne({ _id: requestRecord._id });
    throw new AppError(409, 'Another organization has already requested this donation.');
  }
  await Promise.all([
    notify(donation.donor, { type: 'donation_request', message: `${request.user.ngoProfile.organizationName} requested ${donation.title}.`, resourceType: 'request', resourceId: requestRecord._id }),
    writeAudit(request, { action: 'donation.requested', resourceType: 'donation', resourceId: donation._id }),
  ]);
  response.status(201).json({ success: true, request: requestRecord, donation: updated });
}

export async function listDonationRequests(request, response) {
  const donation = await Donation.findById(request.params.id).select('donor requestedBy');
  if (!donation) throw new AppError(404, 'Donation was not found.');
  const canView = donation.donor.toString() === request.user._id.toString()
    || donation.requestedBy?.toString() === request.user._id.toString();
  if (!canView) throw new AppError(403, 'You cannot view requests for this donation.');
  const requests = await DonationRequest.find({ donation: donation._id }).sort({ createdAt: -1 })
    .populate('ngo', 'name ngoProfile.organizationName ngoProfile.description ngoProfile.city');
  response.json({ success: true, requests });
}

export async function reviewDonationRequest(request, response) {
  const { status } = request.body;
  const donationRequest = await DonationRequest.findById(request.params.id);
  if (!donationRequest) throw new AppError(404, 'Donation request was not found.');
  const donation = await Donation.findOne({ _id: donationRequest.donation, donor: request.user._id });
  if (!donation) throw new AppError(403, 'Only the donor who created this listing can review requests.');
  if (donationRequest.status !== 'pending' || donation.status !== 'requested') {
    throw new AppError(409, 'This request can no longer be reviewed.');
  }
  if (donation.expiresAt <= new Date()) throw new AppError(409, 'The collection deadline has passed; this listing can no longer be accepted.');
  if (status === 'accepted') {
    assertDonationTransition(donation.status, 'accepted');
    const updatedRequest = await DonationRequest.findOneAndUpdate(
      { _id: donationRequest._id, status: 'pending' },
      { $set: { status: 'accepted', reviewedBy: request.user._id, reviewedAt: new Date() } },
      { new: true },
    );
    if (!updatedRequest) throw new AppError(409, 'This request has already been reviewed.');
    const updatedDonation = await Donation.findOneAndUpdate(
      { _id: donation._id, status: 'requested', activeRequest: updatedRequest._id, requestedBy: updatedRequest.ngo },
      { $set: { status: 'accepted', assignedNgo: updatedRequest.ngo }, $push: { history: { status: 'accepted', changedBy: request.user._id } } },
      { new: true },
    );
    if (!updatedDonation) {
      await DonationRequest.updateOne({ _id: updatedRequest._id, status: 'accepted' }, { $set: { status: 'pending', reviewedBy: null, reviewedAt: null } });
      throw new AppError(409, 'Donation state changed before this request could be accepted.');
    }
    await Promise.all([
      notify(updatedRequest.ngo, { type: 'request_accepted', message: `Your request for ${donation.title} was accepted.`, resourceType: 'donation', resourceId: donation._id }),
      writeAudit(request, { action: 'donation_request.accepted', resourceType: 'donation', resourceId: donation._id }),
    ]);
    return response.json({ success: true, request: updatedRequest, donation: updatedDonation });
  }

  assertDonationTransition(donation.status, 'available');
  const updatedRequest = await DonationRequest.findOneAndUpdate(
    { _id: donationRequest._id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: request.user._id, reviewedAt: new Date() } },
    { new: true },
  );
  if (!updatedRequest) throw new AppError(409, 'This request has already been reviewed.');
  const updatedDonation = await Donation.findOneAndUpdate(
    { _id: donation._id, status: 'requested', activeRequest: updatedRequest._id },
    { $set: { status: 'available', requestedBy: null, activeRequest: null }, $push: { history: { status: 'available', changedBy: request.user._id, note: 'The request was declined.' } } },
    { new: true },
  );
  if (!updatedDonation) throw new AppError(409, 'Donation state changed before this request could be declined.');
  await Promise.all([
    notify(updatedRequest.ngo, { type: 'request_rejected', message: `Your request for ${donation.title} was not accepted.`, resourceType: 'donation', resourceId: donation._id }),
    writeAudit(request, { action: 'donation_request.rejected', resourceType: 'donation', resourceId: donation._id }),
  ]);
  return response.json({ success: true, request: updatedRequest, donation: updatedDonation });
}

export async function cancelDonation(request, response) {
  const donation = await Donation.findOne({ _id: request.params.id, donor: request.user._id });
  if (!donation) throw new AppError(404, 'Donation was not found.');
  if (!['available', 'requested'].includes(donation.status)) throw new AppError(409, 'Only an available or requested donation can be cancelled.');
  if (donation.activeRequest) {
    await DonationRequest.findOneAndUpdate(
      { _id: donation.activeRequest, status: 'pending' },
      { $set: { status: 'withdrawn', reviewedBy: request.user._id, reviewedAt: new Date() } },
    );
  }
  addHistory(donation, 'cancelled', request.user._id, 'Cancelled by donor.');
  await donation.save();
  await writeAudit(request, { action: 'donation.cancelled', resourceType: 'donation', resourceId: donation._id });
  response.json({ success: true, donation });
}
