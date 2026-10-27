import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ['new', 'reviewed', 'closed'], default: 'new', index: true },
}, { timestamps: true });

export default mongoose.model('ContactMessage', contactMessageSchema);
