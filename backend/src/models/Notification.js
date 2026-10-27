import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['donation_request', 'request_accepted', 'request_rejected', 'donation_expired', 'collection_scheduled', 'food_collected', 'distribution_recorded', 'ngo_verification'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  resourceType: { type: String, enum: ['donation', 'request', 'verification'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
export default mongoose.model('Notification', notificationSchema);
