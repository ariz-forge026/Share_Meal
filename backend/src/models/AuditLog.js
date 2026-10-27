import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  action: { type: String, required: true, trim: true, maxlength: 100 },
  resourceType: { type: String, required: true, trim: true, maxlength: 60 },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, maxlength: 64, default: '' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
export default mongoose.model('AuditLog', auditLogSchema);
