import mongoose, { Document, Schema, Model } from 'mongoose';

interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city: string;
  state?: string;
  pincode?: string;
}

interface ISalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface IJob extends Document {
  // Owner reference
  ownerId: mongoose.Types.ObjectId;
  
  // Basic info
  title: string;
  description: string;
  salonName: string;
  salonLogo?: string;
  
  // Job details
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance';
  skills: string[];
  experienceRequired: number; // minimum years
  salary: ISalaryRange;
  
  // Location (for geospatial queries)
  location: ILocation;
  
  // Requirements
  requirements: string[];
  benefits: string[];
  
  // Unified Status Lifecycle: DRAFT → PAYMENT_PENDING → APPROVED → LIVE → EXPIRED → CLOSED
  status: 'DRAFT' | 'PAYMENT_PENDING' | 'APPROVED' | 'LIVE' | 'EXPIRED' | 'CLOSED';
  isUrgent: boolean;
  isFeatured: boolean;

  // Payment & visibility (Single Source of Truth)
  paymentStatus: 'none' | 'pending' | 'approved' | 'rejected';
  paymentScreenshotUrl?: string;
  paymentAmount?: number;
  paymentPlan?: string;
  paymentSubmittedAt?: Date;
  paymentId?: mongoose.Types.ObjectId;
  visibility: 'private' | 'public';
  isLive: boolean;
  isVisible: boolean; // Public visibility for job seekers
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Stats
  viewCount: number;
  applicationCount: number;
  
  // Dates
  postedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 2 && 
               v[0] >= -180 && v[0] <= 180 &&
               v[1] >= -90 && v[1] <= 90;
      },
      message: 'Invalid coordinates'
    }
  },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  pincode: String
}, { _id: false });

const salaryRangeSchema = new Schema<ISalaryRange>({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  period: { 
    type: String, 
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'monthly'
  }
}, { _id: false });

const jobSchema = new Schema<IJob>({
  ownerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100 
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 5000 
  },
  salonName: { type: String, required: true, trim: true },
  salonLogo: String,
  
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'freelance'],
    required: true 
  },
  skills: [{ type: String, trim: true }],
  experienceRequired: { type: Number, default: 0, min: 0 },
  salary: { type: salaryRangeSchema, required: true },
  
  location: { type: locationSchema, required: true },
  
  requirements: [{ type: String, trim: true }],
  benefits: [{ type: String, trim: true }],
  
  status: { 
    type: String, 
    enum: ['DRAFT', 'PAYMENT_PENDING', 'APPROVED', 'LIVE', 'EXPIRED', 'CLOSED'],
    default: 'DRAFT',
    index: true
  },
  isUrgent: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  paymentStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
    index: true
  },
  paymentScreenshotUrl: String,
  paymentAmount: Number,
  paymentPlan: String,
  paymentSubmittedAt: Date,
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    sparse: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private',
    index: true
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true
  },
  isVisible: {
    type: Boolean,
    default: false,
    index: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  approvedAt: Date,
  rejectionReason: String,
  
  viewCount: { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  
  postedAt: { type: Date, default: Date.now },
  expiresAt: Date
}, {
  timestamps: true
});

// 2dsphere index for geospatial queries
jobSchema.index({ 'location': '2dsphere' });

// Compound indexes for common queries
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ status: 1, skills: 1 });
jobSchema.index({ ownerId: 1, status: 1 });
jobSchema.index({ ownerId: 1, paymentStatus: 1 });
jobSchema.index({ isUrgent: 1, isFeatured: 1, postedAt: -1 });
// Job seeker visibility filter - only show LIVE + visible jobs
jobSchema.index({ status: 1, isVisible: 1, postedAt: -1 });
// Admin job payment review - find pending payments
jobSchema.index({ paymentStatus: 1, status: 1, createdAt: -1 });
// Find jobs by owner and payment status
jobSchema.index({ ownerId: 1, paymentStatus: 1, createdAt: -1 });

// Text index for search
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  salonName: 'text',
  skills: 'text' 
});

// Virtual for distance (populated during geospatial queries)
jobSchema.virtual('distance').get(function() {
  return (this as unknown as { _distance?: number })._distance;
});

// Ensure virtuals are included in JSON
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

const Job: Model<IJob> = mongoose.model<IJob>('Job', jobSchema);

export default Job;
