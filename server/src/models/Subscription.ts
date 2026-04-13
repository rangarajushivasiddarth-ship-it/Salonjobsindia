import mongoose, { Document, Schema, Model } from 'mongoose';

interface IPaymentProof {
  screenshotUrl: string;
  uploadedAt: Date;
  transactionId?: string;
  paymentMethod: 'upi' | 'bank_transfer' | 'cash' | 'other';
  note?: string;
}

interface IFeatures {
  maxJobPosts: number;
  maxApplicationsPerJob: number;
  featuredListings: number;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  resumeBuilder: boolean;
  unlimitedApplications: boolean;
}

export interface ISubscription extends Document {
  // User reference
  userId: mongoose.Types.ObjectId;
  userRole: 'professional' | 'owner';
  
  // Plan details
  planId: string;
  planName: string;
  planType: 'free' | 'basic' | 'premium' | 'enterprise';
  
  // Pricing
  amount: number;
  currency: string;
  duration: number; // in days
  
  // Features included
  features: IFeatures;
  
  // Status
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'rejected';
  
  // Payment
  paymentProof?: IPaymentProof;
  
  // Admin review
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  rejectionReason?: string;
  
  // Dates
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentProofSchema = new Schema<IPaymentProof>({
  screenshotUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  transactionId: String,
  paymentMethod: { 
    type: String, 
    enum: ['upi', 'bank_transfer', 'cash', 'other'],
    required: true 
  },
  note: String
}, { _id: false });

const featuresSchema = new Schema<IFeatures>({
  maxJobPosts: { type: Number, default: 0 },
  maxApplicationsPerJob: { type: Number, default: 0 },
  featuredListings: { type: Number, default: 0 },
  prioritySupport: { type: Boolean, default: false },
  analyticsAccess: { type: Boolean, default: false },
  resumeBuilder: { type: Boolean, default: false },
  unlimitedApplications: { type: Boolean, default: false }
}, { _id: false });

const subscriptionSchema = new Schema<ISubscription>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  userRole: { 
    type: String, 
    enum: ['professional', 'owner'],
    required: true 
  },
  
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  planType: { 
    type: String, 
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true 
  },
  
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  duration: { type: Number, required: true }, // days
  
  features: { type: featuresSchema, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'active', 'expired', 'cancelled', 'rejected'],
    default: 'pending' 
  },
  
  paymentProof: paymentProofSchema,
  
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNote: String,
  rejectionReason: String,
  
  startDate: Date,
  endDate: Date
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, createdAt: -1 });
subscriptionSchema.index({ endDate: 1 }); // For expiry checks

// Virtual to check if subscription is currently active
subscriptionSchema.virtual('isCurrentlyActive').get(function() {
  if (this.status !== 'active') return false;
  if (!this.endDate) return false;
  return new Date() < this.endDate;
});

subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;
