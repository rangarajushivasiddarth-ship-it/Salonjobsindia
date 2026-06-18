import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILocationAttempt extends Document {
  // Reference
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Attempt tracking
  attemptNumber: number;
  locationSource: 'geolocation_api' | 'ip_geolocation' | 'manual_entry' | 'cache';

  // Location data
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Status
  success: boolean;
  errorMessage?: string;
  errorCode?: string;

  // Context
  userAgent?: string;
  ipAddress?: string;

  createdAt: Date;
  updatedAt: Date;
}

const locationAttemptSchema = new Schema<ILocationAttempt>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    locationSource: {
      type: String,
      enum: ['geolocation_api', 'ip_geolocation', 'manual_entry', 'cache'],
      required: true,
    },

    latitude: {
      type: Number,
      validate: {
        validator: function (v: number | undefined) {
          if (v === undefined || v === null) return true;
          return v >= -90 && v <= 90;
        },
        message: 'Latitude must be between -90 and 90',
      },
    },
    longitude: {
      type: Number,
      validate: {
        validator: function (v: number | undefined) {
          if (v === undefined || v === null) return true;
          return v >= -180 && v <= 180;
        },
        message: 'Longitude must be between -180 and 180',
      },
    },
    accuracy: {
      type: Number,
      min: 0,
    },
    address: String,
    city: String,
    state: String,
    pincode: String,

    success: {
      type: Boolean,
      default: false,
      index: true,
    },
    errorMessage: String,
    errorCode: String,

    userAgent: String,
    ipAddress: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for queries
locationAttemptSchema.index({ jobId: 1, success: 1 });
locationAttemptSchema.index({ userId: 1, createdAt: -1 });
locationAttemptSchema.index({ success: 1, createdAt: -1 });
locationAttemptSchema.index({ locationSource: 1 });

const LocationAttempt: Model<ILocationAttempt> = mongoose.model<ILocationAttempt>(
  'LocationAttempt',
  locationAttemptSchema
);

export default LocationAttempt;
