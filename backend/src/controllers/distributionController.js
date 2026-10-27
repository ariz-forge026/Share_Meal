import Donation from '../models/Donation.js';
import DistributionRecord from '../models/DistributionRecord.js';
import AppError from '../utils/AppError.js';
import { notify } from '../services/notificationService.js';
import { writeAudit } from '../services/auditService.js';
import { assertDonationTransition } from '../utils/donationState.js';

export async function recordDistribution(request, response) {
  const donation = await Donation.findOne({
    _id: request.params.id,
    assignedNgo: request.user._id,
    status: 'collected',
  });
  if (!donation) throw new AppError(409, 'Only collected donations assigned to your NGO can be distributed.');
  assertDonationTransition(donation.status, 'completed');
  if (request.body.quantityDistributed > donation.quantity) {
    throw new AppError(400, 'Distributed quantity cannot exceed the listed quantity.');
  }
  const distributedAt = new Date(request.body.distributedAt || Date.now());
  if (distributedAt > new Date() || distributedAt < donation.createdAt) {
    throw new AppError(400, 'Distribution date must be between listing creation and now.');
  }
  const record = await DistributionRecord.create({
    donation: donation._id,
    ngo: request.user._id,
    createdBy: request.user._id,
    distributedAt,
    quantityDistributed: request.body.quantityDistributed,
    recipientsEstimate: request.body.recipientsEstimate,
    notes: request.body.notes || '',
  });
  const completed = await Donation.findOneAndUpdate(
    { _id: donation._id, assignedNgo: request.user._id, status: 'collected' },
    {
      $set: { status: 'completed', distributionNote: request.body.notes || '' },
      $push: {
        history: { $each: [
          { status: 'distributed', changedBy: request.user._id, note: 'Distribution recorded.' },
          { status: 'completed', changedBy: request.user._id, note: 'Donation workflow completed.' },
        ] },
      },
    },
    { new: true },
  );
  if (!completed) {
    await DistributionRecord.deleteOne({ _id: record._id });
    throw new AppError(409, 'Donation status changed before distribution could be recorded.');
  }
  await Promise.all([
    notify(donation.donor, { type: 'distribution_recorded', message: `${donation.title} was distributed. Recipients are a reported estimate.`, resourceType: 'donation', resourceId: donation._id }),
    writeAudit(request, { action: 'distribution.recorded', resourceType: 'donation', resourceId: donation._id, details: { recipientsEstimate: record.recipientsEstimate } }),
  ]);
  response.status(201).json({ success: true, record, donation: completed });
}

export async function listDistributionHistory(request, response) {
  const filter = request.user.role === 'ngo'
    ? { ngo: request.user._id }
    : { createdBy: request.user._id };
  const records = await DistributionRecord.find(filter).sort({ distributedAt: -1 }).limit(100)
    .populate('donation', 'title category quantity unit city')
    .populate('ngo', 'name ngoProfile.organizationName');
  response.json({ success: true, records });
}
