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
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  isUrgent: boolean;
  isFeatured: boolean;

  // Payment & visibility
  paymentStatus: 'pending_approval' | 'approved' | 'rejected';
  paymentId?: mongoose.Types.ObjectId;
  visibility: 'private' | 'public';
  isLive: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  
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
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    default: 'active' 
  },
  isUrgent: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  paymentStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval',
    index: true
  },
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
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  approvedAt: Date,
  
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
// Job seeker visibility filter
jobSchema.index({ isLive: 1, visibility: 1, paymentStatus: 1 });
// Admin job payment review
jobSchema.index({ paymentStatus: 1, createdAt: -1 });

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
