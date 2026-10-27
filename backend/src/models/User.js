import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: {
    type: [Number],
    validate: {
      validator: (coordinates) => coordinates.length === 2
        && coordinates[0] >= -180 && coordinates[0] <= 180
        && coordinates[1] >= -90 && coordinates[1] <= 90,
      message: 'Coordinates must be [longitude, latitude] within valid ranges.',
    },
  },
}, { _id: false });

const ngoProfileSchema = new mongoose.Schema({
  organizationName: { type: String, trim: true, maxlength: 120 },
  legalName: { type: String, trim: true, maxlength: 160 },
  registrationCategory: { type: String, trim: true, maxlength: 80 },
  registrationNumber: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  address: { type: String, trim: true, maxlength: 250 },
  city: { type: String, trim: true, maxlength: 80 },
  location: { type: pointSchema, default: undefined },
  serviceRadiusKm: { type: Number, min: 1, max: 250, default: 25 },
  contactPhone: { type: String, trim: true, maxlength: 30 },
  categoriesAccepted: [{ type: String, enum: ['prepared', 'produce', 'packaged', 'bakery', 'other'] }],
  operatingHours: { type: String, trim: true, maxlength: 200 },
  verificationStatus: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected', 'needs_more_information'], default: 'not_submitted' },
  verification: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    decisionNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
}, { _id: false });

const donorProfileSchema = new mongoose.Schema({
  donorType: { type: String, enum: ['individual', 'restaurant', 'hotel', 'cafe', 'caterer', 'grocery', 'food_shop', 'event_organizer', 'other'], default: 'individual' },
  businessName: { type: String, trim: true, maxlength: 120 },
  address: { type: String, trim: true, maxlength: 250 },
  city: { type: String, trim: true, maxlength: 80 },
  location: { type: pointSchema, default: undefined },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  passwordHash: { type: String, required: true, select: false },
  tokenVersion: { type: Number, default: 0, select: false },
  role: { type: String, enum: ['donor', 'ngo', 'volunteer', 'admin'], required: true },
  accountStatus: { type: String, enum: ['active', 'suspended', 'disabled'], default: 'active', index: true },
  donorProfile: { type: donorProfileSchema, default: undefined },
  ngoProfile: { type: ngoProfileSchema, default: undefined },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
}, { timestamps: true });

userSchema.index({ role: 1, 'ngoProfile.verificationStatus': 1, 'ngoProfile.city': 1 });
userSchema.index({ 'ngoProfile.location': '2dsphere' });
userSchema.index({ 'donorProfile.location': '2dsphere' });

export default mongoose.model('User', userSchema);
