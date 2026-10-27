import mongoose from 'mongoose';

const donationRequestSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true, index: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

donationRequestSchema.index({ donation: 1, ngo: 1 }, { unique: true });
export default mongoose.model('DonationRequest', donationRequestSchema);
