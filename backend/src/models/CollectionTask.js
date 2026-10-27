import mongoose from 'mongoose';

const collectionTaskSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true, unique: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'collected', 'cancelled', 'expired'], default: 'scheduled', index: true },
  confirmationNote: { type: String, trim: true, maxlength: 500, default: '' },
  collectedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('CollectionTask', collectionTaskSchema);
