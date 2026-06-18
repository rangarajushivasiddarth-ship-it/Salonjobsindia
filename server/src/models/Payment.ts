import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayment extends Document {
  // Payment identifiers
  orderId?: string;
  paymentId?: string;
  transactionReference?: string;

  // Payer info
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail?: string;
  userPhone: string;

  // Payment details
  type: 'job_publishing' | 'contact_pack' | 'job_seeker_subscription';
  amount: number;
  currency: string;
  paymentMethod: 'screenshot' | 'stripe' | 'other';
  screenshotUrl?: string;

  // Relationship to resources
  jobId?: mongoose.Types.ObjectId;
  planId?: string;
  planName?: string;

  // Status tracking
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: String,
    paymentId: String,
    transactionReference: String,

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: String,
    userPhone: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['job_publishing', 'contact_pack', 'job_seeker_subscription'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['screenshot', 'stripe', 'other'],
      default: 'screenshot',
    },
    screenshotUrl: String,

    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    planId: String,
    planName: String,

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,

    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ type: 1, status: 1 });
paymentSchema.index({ jobId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
