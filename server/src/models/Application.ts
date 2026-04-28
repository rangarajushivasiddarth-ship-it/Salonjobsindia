import mongoose, { Document, Schema, Model } from 'mongoose';

interface IStatusHistory {
  status: string;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IApplication extends Document {
  // References
  jobId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId; // Denormalized for easier queries
  
  // Application content
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  availableFrom?: Date;
  
  // Status tracking
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'withdrawn';
  statusHistory: IStatusHistory[];
  
  // Owner response
  ownerNote?: string;
  interviewDate?: Date;
  interviewLocation?: string;
  
  // Professional can add notes
  professionalNote?: string;
  
  // Flags
  isViewed: boolean;
  viewedAt?: Date;
  
  // Timestamps
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  note: String
}, { _id: false });

const applicationSchema = new Schema<IApplication>({
  jobId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true,
    index: true 
  },
  professionalId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  ownerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  coverLetter: { type: String, maxlength: 2000 },
  resumeUrl: String,
  expectedSalary: { type: Number, min: 0 },
  availableFrom: Date,
  
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected', 'withdrawn'],
    default: 'pending' 
  },
  statusHistory: [statusHistorySchema],
  
  ownerNote: { type: String, maxlength: 1000 },
  interviewDate: Date,
  interviewLocation: String,
  
  professionalNote: { type: String, maxlength: 1000 },
  
  isViewed: { type: Boolean, default: false },
  viewedAt: Date,
  
  appliedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes for common queries
applicationSchema.index({ jobId: 1, professionalId: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ professionalId: 1, status: 1, appliedAt: -1 });
applicationSchema.index({ ownerId: 1, status: 1, appliedAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });

// Middleware to add status to history on status change
applicationSchema.pre('save', function(this: IApplication, next: (err?: Error) => void) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

const Application: Model<IApplication> = mongoose.model<IApplication>('Application', applicationSchema);

export default Application;
