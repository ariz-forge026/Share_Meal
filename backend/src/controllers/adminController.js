import { listNgosForReview, setNgoVerification } from '../services/ngoVerificationService.js';
import { writeAudit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';
import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
import DistributionRecord from '../models/DistributionRecord.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';
import { parsePagination } from '../utils/location.js';
import ContactMessage from '../models/ContactMessage.js';

export async function getNgosForReview(request, response, statusOverride) {
  const ngos = await listNgosForReview(statusOverride || request.query.status);
  response.json({ success: true, ngos });
}

export async function getPendingNgos(request, response) {
  return getNgosForReview(request, response, 'pending');
}

export async function updateNgoVerification(request, response) {
  const ngo = await setNgoVerification(request.params.id, request.body.status, request.user._id, request.body.decisionNote);
  await Promise.all([
    writeAudit(request, { action: `ngo.verification_${request.body.status}`, resourceType: 'ngo', resourceId: ngo._id, details: { decisionNote: request.body.decisionNote || '' } }),
    notify(ngo._id, { type: 'ngo_verification', message: `Your verification application was ${request.body.status.replaceAll('_', ' ')}.${request.body.decisionNote ? ` ${request.body.decisionNote}` : ''}`, resourceType: 'verification', resourceId: ngo._id }),
  ]);
  return response.json({
    success: true,
    ngo: {
      id: ngo._id,
      organizationName: ngo.ngoProfile.organizationName,
      verificationStatus: ngo.ngoProfile.verificationStatus,
    },
  });
}

export async function getDashboard(request, response) {
  const [activeDonations, completedDonations, awaitingCollection, pendingRequests, pendingNgos, distributionCount, recipients] = await Promise.all([
    Donation.countDocuments({ status: { $in: ['available', 'requested', 'accepted', 'pickup_scheduled', 'collected'] } }),
    Donation.countDocuments({ status: 'completed' }),
    Donation.countDocuments({ status: { $in: ['accepted', 'pickup_scheduled'] } }),
    DonationRequest.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'ngo', 'ngoProfile.verificationStatus': 'pending' }),
    DistributionRecord.countDocuments(),
    DistributionRecord.aggregate([{ $group: { _id: null, total: { $sum: '$recipientsEstimate' } } }]),
  ]);
  response.json({ success: true, stats: { activeDonations, completedDonations, awaitingCollection, pendingRequests, pendingNgos, distributionRecords: distributionCount, reportedRecipientsEstimate: recipients[0]?.total || 0 } });
}

export async function listAdminDonations(request, response) {
  const { page, limit, skip } = parsePagination(request.query);
  const filter = {};
  if (request.query.status) filter.status = request.query.status;
  const [donations, total] = await Promise.all([
    Donation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('donor', 'name email').populate('assignedNgo', 'name email ngoProfile.organizationName'),
    Donation.countDocuments(filter),
  ]);
  response.json({ success: true, donations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function listAuditLogs(request, response) {
  const { page, limit, skip } = parsePagination(request.query);
  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name email role'),
    AuditLog.countDocuments(),
  ]);
  response.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function moderateContactMessage(request, response) {
  const status = request.body.status;
  if (!['reviewed', 'closed'].includes(status)) throw new AppError(400, 'Contact message status must be reviewed or closed.');
  const message = await ContactMessage.findByIdAndUpdate(request.params.id, { $set: { status } }, { new: true });
  if (!message) throw new AppError(404, 'Contact message was not found.');
  await writeAudit(request, { action: 'contact_message.moderated', resourceType: 'contact_message', resourceId: message._id, details: { status } });
  response.json({ success: true, message });
}

export async function listAdminContactMessages(request, response) {
  const { page, limit, skip } = parsePagination(request.query);
  const filter = request.query.status ? { status: request.query.status } : {};
  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  response.json({ success: true, messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
