import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || ''

let client: MongoClient | null = null
let db: Db | null = null

// Connect to MongoDB Atlas
export async function connectToDatabase(): Promise<Db> {
  if (db) return db
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }
  
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db('fitonze_db')
    console.log('Connected to MongoDB Atlas')
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Get collection helper
export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const database = await connectToDatabase()
  return database.collection<T>(name)
}

// Types
export interface UserDocument {
  _id?: ObjectId
  name: string
  email: string
  phone: string
  password: string // Should be hashed in production
  role: 'job_seeker' | 'salon_owner'
  createdAt: Date
  updatedAt: Date
}

export interface JobSeekerDocument {
  _id?: ObjectId
  userId: string
  name: string
  role: string
  dateOfBirth: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
  }
  identityProof: {
    type: string
    verified: boolean
  }
  passportPhotoUrl: string
  isSubscribed: boolean
  subscriptionPlan: string | null
  subscriptionExpiry: Date | null
  visibilityStatus?: 'incomplete_profile' | 'pending_payment' | 'pending_admin_approval' | 'active_visible' | 'hidden' | 'rejected'
  paymentId?: string
  adminApprovedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SalonOwnerDocument {
  _id?: ObjectId
  userId: string
  salonName: string
  ownerName: string
  phone: string
  email: string
  address: string
  location: {
    lat: number
    lng: number
  }
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface JobDocument {
  _id?: ObjectId
  ownerId: string
  salonName: string
  title: string
  description: string
  requirements: string[]
  salary: string
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'draft' | 'pending_payment' | 'pending_admin_approval' | 'live' | 'expired' | 'rejected'
  paymentId?: string
  paymentStatus?: 'pending_payment' | 'approved' | 'rejected'
  isActive: boolean
  applicants: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ApplicationDocument {
  _id?: ObjectId
  jobId: string
  jobSeekerId: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  appliedAt: Date
  updatedAt: Date
}

export interface PaymentDocument {
  _id?: ObjectId
  userId: string
  userName?: string
  userPhone?: string
  salonName?: string
  type: 'job_publishing' | 'job_seeker_subscription' | 'verified_badge' | 'contact_pack'
  planId: string
  amount: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  jobId?: string
  resumeId?: string
  contactCredits?: number
  validityDays: number
  transactionId?: string
  submittedAt: Date
  processedAt?: Date
  processedBy?: string
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

// Export ObjectId for use in other files
export { ObjectId }
