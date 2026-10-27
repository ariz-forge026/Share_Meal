import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import CollectionTask from '../models/CollectionTask.js';
import { assertDonationTransition } from '../utils/donationState.js';

export async function expireDueDonations(now = new Date()) {
  const due = await Donation.find({
    status: { $in: ['available', 'requested', 'accepted', 'pickup_scheduled'] },
    expiresAt: { $lte: now },
  }).select('_id donor activeRequest assignedNgo status').limit(200);
  let expiredCount = 0;
  for (const donation of due) {
    assertDonationTransition(donation.status, 'expired');
    const task = donation.status === 'pickup_scheduled'
      ? await CollectionTask.findOne({ donation: donation._id, status: 'scheduled' }).select('_id volunteer')
      : null;
    const updated = await Donation.findOneAndUpdate(
      { _id: donation._id, status: donation.status, expiresAt: { $lte: now } },
      { $set: { status: 'expired', requestedBy: null, activeRequest: null }, $push: { history: { status: 'expired', note: 'Collection deadline passed.', changedAt: now } } },
    );
    if (!updated) continue;
    expiredCount += 1;
    if (donation.activeRequest) {
      await DonationRequest.updateOne({ _id: donation.activeRequest, status: 'pending' }, { $set: { status: 'withdrawn', reviewedAt: now } });
    }
    if (task) await CollectionTask.updateOne({ _id: task._id, status: 'scheduled' }, { $set: { status: 'expired' } });
    const notifications = [
      AuditLog.create({ action: 'donation.expired', resourceType: 'donation', resourceId: donation._id, details: { reason: 'collection_deadline_passed' } }),
      Notification.create({ recipient: donation.donor, type: 'donation_expired', message: 'A food listing expired because its collection deadline passed.', resourceType: 'donation', resourceId: donation._id }),
    ];
    if (donation.assignedNgo) notifications.push(Notification.create({
      recipient: donation.assignedNgo,
      type: 'donation_expired',
      message: 'A food collection expired because its deadline passed.',
      resourceType: 'donation',
      resourceId: donation._id,
    }));
    if (task) notifications.push(Notification.create({
      recipient: task.volunteer,
      type: 'donation_expired',
      message: 'A collection task expired because the donation deadline passed.',
      resourceType: 'donation',
      resourceId: donation._id,
    }));
    await Promise.all(notifications);
  }
  return expiredCount;
}
