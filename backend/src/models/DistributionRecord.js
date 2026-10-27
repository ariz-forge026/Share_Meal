import mongoose from 'mongoose';

const distributionRecordSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true, unique: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distributedAt: { type: Date, required: true },
  quantityDistributed: { type: Number, required: true, min: 0 },
  recipientsEstimate: { type: Number, required: true, min: 0, max: 100000 },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

export default mongoose.model('DistributionRecord', distributionRecordSchema);
