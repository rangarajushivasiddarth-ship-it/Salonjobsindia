import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interfaces for embedded documents
interface IPortfolioItem {
  id: string;
  url: string;
  caption?: string;
  createdAt: Date;
}

interface IWorkExperience {
  id: string;
  salonName: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
}

interface ICertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  imageUrl?: string;
}

interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// Main User interface
export interface IUser extends Document {
  // Common fields
  phone: string;
  email?: string;
  password?: string; // Only for admins
  role: 'professional' | 'owner' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Profile fields
  name: string;
  avatar?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  
  // Professional/Owner specific
  skills?: string[];
  experience?: number; // years
  portfolio?: IPortfolioItem[];
  workHistory?: IWorkExperience[];
  certifications?: ICertification[];
  
  // Location for geospatial queries
  location?: ILocation;
  
  // Owner specific
  salonName?: string;
  salonAddress?: string;
  salonDescription?: string;
  
  // Subscription
  subscriptionId?: mongoose.Types.ObjectId;
  subscriptionStatus?: 'none' | 'pending' | 'active' | 'expired';
  
  // OTP for verification
  otp?: string;
  otpExpiry?: Date;
  
  // Admin specific
  adminPermissions?: string[];
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const portfolioItemSchema = new Schema<IPortfolioItem>({
  id: { type: String, required: true },
  url: { type: String, required: true },
  caption: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const workExperienceSchema = new Schema<IWorkExperience>({
  id: { type: String, required: true },
  salonName: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String
}, { _id: false });

const certificationSchema = new Schema<ICertification>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: Date,
  imageUrl: String
}, { _id: false });

const locationSchema = new Schema<ILocation>({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 2 && 
               v[0] >= -180 && v[0] <= 180 && // longitude
               v[1] >= -90 && v[1] <= 90;      // latitude
      },
      message: 'Invalid coordinates'
    }
  },
  address: String,
  city: String,
  state: String,
  pincode: String
}, { _id: false });

const userSchema = new Schema<IUser>({
  // Common fields
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  email: { 
    type: String, 
    sparse: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: { 
    type: String,
    select: false // Don't include password in queries by default
  },
  role: { 
    type: String, 
    enum: ['professional', 'owner', 'admin'], 
    required: true 
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Profile fields
  name: { type: String, required: true, trim: true },
  avatar: String,
  bio: { type: String, maxlength: 500 },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,

  // Professional/Owner specific
  skills: [{ type: String, trim: true }],
  experience: { type: Number, min: 0, max: 50 },
  portfolio: [portfolioItemSchema],
  workHistory: [workExperienceSchema],
  certifications: [certificationSchema],

  // Location
  location: locationSchema,

  // Owner specific
  salonName: { type: String, trim: true },
  salonAddress: { type: String, trim: true },
  salonDescription: { type: String, maxlength: 1000 },

  // Subscription
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  subscriptionStatus: { 
    type: String, 
    enum: ['none', 'pending', 'active', 'expired'],
    default: 'none'
  },

  // OTP
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },

  // Admin specific
  adminPermissions: [String]
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
userSchema.index({ 'location': '2dsphere' });

// Index for phone lookups
userSchema.index({ phone: 1 });

// Index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

// Hash password before saving (for admins)
userSchema.pre('save', async function(this: IUser, next: (err?: Error) => void) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
