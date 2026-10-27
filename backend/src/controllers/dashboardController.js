import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
import CollectionTask from '../models/CollectionTask.js';
import DistributionRecord from '../models/DistributionRecord.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export async function getMyDashboard(request, response) {
  const { _id: userId, role } = request.user;
  if (role === 'admin') {
    const [activeDonations, completedDonations, pendingRequests, pendingNgos, recipients] = await Promise.all([
      Donation.countDocuments({ status: { $in: ['available', 'requested', 'accepted', 'pickup_scheduled', 'collected'] } }),
      Donation.countDocuments({ status: 'completed' }),
      DonationRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'ngo', 'ngoProfile.verificationStatus': 'pending' }),
      DistributionRecord.aggregate([{ $group: { _id: null, total: { $sum: '$recipientsEstimate' } } }]),
    ]);
    return response.json({ success: true, role, stats: { activeDonations, completedDonations, pendingRequests, pendingNgos, reportedRecipientsEstimate: recipients[0]?.total || 0 } });
  }
  if (role === 'donor') {
    const [activeDonations, completedDonations, awaitingCollection, latest] = await Promise.all([
      Donation.countDocuments({ donor: userId, status: { $in: ['available', 'requested', 'accepted', 'pickup_scheduled', 'collected'] } }),
      Donation.countDocuments({ donor: userId, status: 'completed' }),
      Donation.countDocuments({ donor: userId, status: { $in: ['accepted', 'pickup_scheduled'] } }),
      Donation.find({ donor: userId }).sort({ updatedAt: -1 }).limit(5).select('title status category quantity unit city expiresAt updatedAt'),
    ]);
    return response.json({ success: true, role, stats: { activeDonations, completedDonations, awaitingCollection }, latest });
  }
  if (role === 'ngo') {
    const [requested, accepted, awaitingCollection, distributions, latest] = await Promise.all([
      Donation.countDocuments({ requestedBy: userId, status: 'requested' }),
      Donation.countDocuments({ assignedNgo: userId, status: 'accepted' }),
      Donation.countDocuments({ assignedNgo: userId, status: 'pickup_scheduled' }),
      DistributionRecord.countDocuments({ ngo: userId }),
      Donation.find({ $or: [{ assignedNgo: userId }, { requestedBy: userId }] }).sort({ updatedAt: -1 }).limit(5).select('title status category quantity unit city expiresAt updatedAt'),
    ]);
    return response.json({ success: true, role, verificationStatus: request.user.ngoProfile.verificationStatus, stats: { requested, accepted, awaitingCollection, distributions }, latest });
  }
  if (role === 'volunteer') {
    const [assignedTasks, completedTasks, tasks] = await Promise.all([
      CollectionTask.countDocuments({ volunteer: userId, status: 'scheduled' }),
      CollectionTask.countDocuments({ volunteer: userId, status: 'collected' }),
      CollectionTask.find({ volunteer: userId }).sort({ scheduledAt: -1 }).limit(5)
        .populate('donation', 'title city pickupAddress expiresAt status')
        .select('scheduledAt status donation'),
    ]);
    return response.json({ success: true, role, stats: { assignedTasks, completedTasks }, latest: tasks });
  }
  throw new AppError(403, 'This account does not have a dashboard.');
}
