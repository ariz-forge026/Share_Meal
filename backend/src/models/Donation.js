import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], validate: { validator: (value) => value.length === 2, message: 'Coordinates must contain longitude and latitude.' } },
}, { _id: false });

const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const donationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  category: { type: String, enum: ['prepared', 'produce', 'packaged', 'bakery', 'other'], required: true },
  quantity: { type: Number, required: true, min: 0.01, max: 10000 },
  unit: { type: String, enum: ['portions', 'kg', 'boxes', 'items'], required: true },
  peopleServedEstimate: { type: Number, min: 0, max: 100000, default: null },
  foodType: { type: String, enum: ['vegetarian', 'non_vegetarian', 'vegan', 'unknown'], default: 'unknown' },
  preparedAt: { type: Date, default: null },
  useBy: { type: Date, default: null },
  storageRequirements: { type: String, trim: true, maxlength: 300, default: '' },
  allergens: [{ type: String, trim: true, maxlength: 60 }],
  packagingCondition: { type: String, enum: ['sealed', 'intact', 'needs_review', 'not_applicable'], default: 'not_applicable' },
  handlingInstructions: { type: String, trim: true, maxlength: 500, default: '' },
  pickupAddress: { type: String, required: true, trim: true, maxlength: 250 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  pickupLocation: { type: pointSchema, default: undefined },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['available', 'requested', 'accepted', 'pickup_scheduled', 'collected', 'distributed', 'completed', 'cancelled', 'expired'], default: 'available', index: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedNgo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationRequest', default: null },
  distributionNote: { type: String, trim: true, maxlength: 500, default: '' },
  history: { type: [historySchema], default: [] },
  isDemo: { type: Boolean, default: false, index: true },
}, { timestamps: true });

donationSchema.index({ status: 1, city: 1, expiresAt: 1 });
donationSchema.index({ pickupLocation: '2dsphere' });
donationSchema.index({ title: 'text', description: 'text', city: 'text' });

export default mongoose.model('Donation', donationSchema);
