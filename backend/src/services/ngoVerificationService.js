import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export async function listNgosForReview(status) {
  const filter = { role: 'ngo' };
  if (status) {
    if (!['not_submitted', 'pending', 'approved', 'rejected', 'needs_more_information'].includes(status)) {
      throw new AppError(400, 'NGO verification status is invalid.');
    }
    filter['ngoProfile.verificationStatus'] = status;
  }
  return User.find(filter)
    .select('name email ngoProfile createdAt')
    .sort({ createdAt: -1 }).limit(200);
}

export async function setNgoVerification(ngoId, status, adminId, decisionNote) {
  const ngo = await User.findOne({ _id: ngoId, role: 'ngo' });
  if (!ngo) throw new AppError(404, 'NGO account was not found.');
  if (ngo.ngoProfile.verificationStatus !== 'pending') throw new AppError(409, 'Only pending NGO applications can be reviewed.');
  ngo.ngoProfile.verificationStatus = status;
  ngo.ngoProfile.verification.reviewedBy = adminId;
  ngo.ngoProfile.verification.reviewedAt = new Date();
  ngo.ngoProfile.verification.decisionNote = decisionNote || '';
  await ngo.save();
  return ngo;
}
