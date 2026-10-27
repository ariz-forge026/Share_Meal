import CollectionTask from '../models/CollectionTask.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { notify } from '../services/notificationService.js';
import { writeAudit } from '../services/auditService.js';
import { assertDonationTransition } from '../utils/donationState.js';

export async function scheduleCollection(request, response) {
  const donation = await Donation.findOne({
    _id: request.body.donationId,
    assignedNgo: request.user._id,
    status: 'accepted',
    expiresAt: { $gt: new Date() },
  });
  if (!donation) throw new AppError(409, 'Only accepted, unexpired donations assigned to this NGO can be scheduled.');
  assertDonationTransition(donation.status, 'pickup_scheduled');

  const volunteer = await User.findOne({
    _id: request.body.volunteerId,
    role: 'volunteer',
    organization: request.user._id,
    accountStatus: 'active',
  });
  if (!volunteer) throw new AppError(404, 'Active volunteer was not found in your organization.');

  const scheduledAt = new Date(request.body.scheduledAt);
  if (scheduledAt <= new Date() || scheduledAt > donation.expiresAt) {
    throw new AppError(400, 'Collection must be scheduled in the future and before the donation deadline.');
  }

  const task = await CollectionTask.create({
    donation: donation._id,
    ngo: request.user._id,
    volunteer: volunteer._id,
    scheduledAt,
  });
  const updatedDonation = await Donation.findOneAndUpdate(
    { _id: donation._id, assignedNgo: request.user._id, status: 'accepted' },
    { $set: { status: 'pickup_scheduled' }, $push: { history: { status: 'pickup_scheduled', changedBy: request.user._id } } },
    { new: true },
  );
  if (!updatedDonation) {
    await CollectionTask.deleteOne({ _id: task._id });
    throw new AppError(409, 'Donation state changed before the collection could be scheduled.');
  }
  await Promise.all([
    notify(volunteer._id, { type: 'collection_scheduled', message: `You have a new collection task for ${donation.title}.`, resourceType: 'donation', resourceId: donation._id }),
    notify(donation.donor, { type: 'collection_scheduled', message: `Collection for ${donation.title} has been scheduled.`, resourceType: 'donation', resourceId: donation._id }),
    writeAudit(request, { action: 'collection.scheduled', resourceType: 'donation', resourceId: donation._id, details: { volunteer: volunteer._id } }),
  ]);
  response.status(201).json({ success: true, task });
}

export async function listMyTasks(request, response) {
  const organizationId = request.user.role === 'volunteer' ? request.user.organization : request.user._id;
  const organization = await User.findOne({
    _id: organizationId,
    role: 'ngo',
    accountStatus: 'active',
    'ngoProfile.verificationStatus': 'approved',
  }).select('_id');
  if (!organization) return response.json({ success: true, tasks: [] });
  const filter = request.user.role === 'volunteer'
    ? { volunteer: request.user._id }
    : { ngo: request.user._id };
  const tasks = await CollectionTask.find(filter).sort({ scheduledAt: -1 }).limit(100)
    .populate('volunteer', 'name').populate('ngo', 'name ngoProfile.organizationName')
    .populate('donation', 'title category quantity unit city pickupAddress expiresAt status donor');
  response.json({ success: true, tasks });
}

export async function updateCollectionTask(request, response) {
  const task = await CollectionTask.findById(request.params.id);
  if (!task) throw new AppError(404, 'Collection task was not found.');
  const isVolunteer = request.user.role === 'volunteer' && task.volunteer.toString() === request.user._id.toString();
  const isNgo = request.user.role === 'ngo' && task.ngo.toString() === request.user._id.toString();
  if (!isVolunteer && !isNgo) throw new AppError(403, 'You are not assigned to this collection task.');
  if (request.body.status !== 'collected' || !isVolunteer) {
    throw new AppError(400, 'Only the assigned volunteer can confirm collection.');
  }
  const organization = await User.findOne({ _id: task.ngo, role: 'ngo', accountStatus: 'active', 'ngoProfile.verificationStatus': 'approved' }).select('_id');
  if (!organization) throw new AppError(403, 'The assigned organization is no longer approved to collect donations.');
  if (task.status !== 'scheduled') throw new AppError(409, 'This collection task has already been updated.');
  if (task.scheduledAt > donation.expiresAt || donation.expiresAt <= new Date()) {
    throw new AppError(409, 'The collection deadline has passed; this task can no longer be confirmed.');
  }

  const donation = await Donation.findOneAndUpdate(
    { _id: task.donation, assignedNgo: task.ngo, status: 'pickup_scheduled' },
    { $set: { status: 'collected' }, $push: { history: { status: 'collected', changedBy: request.user._id, note: request.body.confirmationNote || '' } } },
    { new: true },
  );
  if (!donation) throw new AppError(409, 'Donation is no longer scheduled for collection.');
  assertDonationTransition('pickup_scheduled', 'collected');
  const updatedTask = await CollectionTask.findOneAndUpdate(
    { _id: task._id, volunteer: request.user._id, status: 'scheduled' },
    { $set: { status: 'collected', collectedAt: new Date(), confirmationNote: request.body.confirmationNote || '' } },
    { new: true },
  );
  if (!updatedTask) {
    await Donation.updateOne(
      { _id: donation._id, status: 'collected' },
      { $set: { status: 'pickup_scheduled' }, $push: { history: { status: 'pickup_scheduled', changedBy: request.user._id, note: 'Collection confirmation requires review.' } } },
    );
    throw new AppError(409, 'Collection task changed concurrently. The donation was restored to scheduled status.');
  }
  await Promise.all([
    notify(donation.donor, { type: 'food_collected', message: `${donation.title} was collected.`, resourceType: 'donation', resourceId: donation._id }),
    notify(task.ngo, { type: 'food_collected', message: `${donation.title} was collected by its assigned volunteer.`, resourceType: 'donation', resourceId: donation._id }),
    writeAudit(request, { action: 'collection.confirmed', resourceType: 'donation', resourceId: donation._id }),
  ]);
  response.json({ success: true, task: updatedTask, donation });
}
