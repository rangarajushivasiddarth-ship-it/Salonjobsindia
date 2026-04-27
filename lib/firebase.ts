import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter, updateDoc, deleteDoc, addDoc, increment, Timestamp, writeBatch } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Collection references
const COLLECTIONS = {
  USERS: 'users',
  JOB_SEEKERS: 'job_seekers',
  SALON_OWNERS: 'salon_owners',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
}

// Types
export interface JobSeeker {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  role: string
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
    url: string
  }
  passportPhoto: string
  isVerified: boolean
  isPremium: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  lastActive: Timestamp
  profileViews: number
  status: 'active' | 'hired' | 'inactive'
}

export interface SalonOwner {
  id: string
  name: string
  email: string
  phone: string
  salonName: string
  salonAddress: string
  location: {
    lat: number
    lng: number
    address: string
  }
  businessLicense: string
  isPremium: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  totalJobsPosted: number
  totalHires: number
}

export interface Job {
  id: string
  ownerId: string
  ownerName: string
  salonName: string
  title: string
  description: string
  requirements: string[]
  salary: {
    min: number
    max: number
  }
  location: {
    lat: number
    lng: number
    address: string
  }
  jobType: 'full-time' | 'part-time' | 'contract'
  experience: string
  skills: string[]
  isActive: boolean
  isFeatured: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  applicationsCount: number
  viewsCount: number
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  seekerId: string
  seekerName: string
  seekerPhoto: string
  ownerId: string
  status: 'pending' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected'
  appliedAt: Timestamp
  updatedAt: Timestamp
  notes: string
}

// ============ JOB SEEKER FUNCTIONS ============

export async function createJobSeeker(data: Omit<JobSeeker, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'profileViews' | 'status'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.JOB_SEEKERS), {
    ...data,
    isVerified: false,
    profileViews: 0,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastActive: Timestamp.now(),
  })
  return docRef.id
}

export async function getJobSeeker(id: string): Promise<JobSeeker | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.JOB_SEEKERS, id))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as JobSeeker
  }
  return null
}

export async function updateJobSeeker(id: string, data: Partial<JobSeeker>) {
  await updateDoc(doc(db, COLLECTIONS.JOB_SEEKERS, id), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function getJobSeekers(
  filters?: {
    role?: string
    experience?: string
    skills?: string[]
    location?: string
    status?: string
    isPremium?: boolean
  },
  pageSize = 50,
  lastDoc?: any
) {
  let q = query(
    collection(db, COLLECTIONS.JOB_SEEKERS),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  )

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status))
  }

  if (filters?.isPremium !== undefined) {
    q = query(q, where('isPremium', '==', filters.isPremium))
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }

  const snapshot = await getDocs(q)
  const seekers: JobSeeker[] = []
  snapshot.forEach((doc) => {
    seekers.push({ id: doc.id, ...doc.data() } as JobSeeker)
  })

  return {
    seekers,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === pageSize,
  }
}

export async function getTotalJobSeekers(): Promise<number> {
  // For large collections, use a counter document
  const counterDoc = await getDoc(doc(db, COLLECTIONS.ANALYTICS, 'counters'))
  if (counterDoc.exists()) {
    return counterDoc.data().totalJobSeekers || 0
  }
  return 0
}

// ============ SALON OWNER FUNCTIONS ============

export async function createSalonOwner(data: Omit<SalonOwner, 'id' | 'createdAt' | 'updatedAt' | 'totalJobsPosted' | 'totalHires'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.SALON_OWNERS), {
    ...data,
    totalJobsPosted: 0,
    totalHires: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getSalonOwner(id: string): Promise<SalonOwner | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.SALON_OWNERS, id))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as SalonOwner
  }
  return null
}

// ============ JOB FUNCTIONS ============

export async function createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.JOBS), {
    ...data,
    applicationsCount: 0,
    viewsCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  
  // Increment owner's job count
  await updateDoc(doc(db, COLLECTIONS.SALON_OWNERS, data.ownerId), {
    totalJobsPosted: increment(1),
  })
  
  return docRef.id
}

export async function getJobs(
  filters?: {
    ownerId?: string
    isActive?: boolean
    isFeatured?: boolean
    location?: string
    skills?: string[]
  },
  pageSize = 20,
  lastDoc?: any
) {
  let q = query(
    collection(db, COLLECTIONS.JOBS),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  )

  if (filters?.ownerId) {
    q = query(q, where('ownerId', '==', filters.ownerId))
  }

  if (filters?.isActive !== undefined) {
    q = query(q, where('isActive', '==', filters.isActive))
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }

  const snapshot = await getDocs(q)
  const jobs: Job[] = []
  snapshot.forEach((doc) => {
    jobs.push({ id: doc.id, ...doc.data() } as Job)
  })

  return {
    jobs,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === pageSize,
  }
}

export async function getJobsByOwner(ownerId: string): Promise<Job[]> {
  const q = query(
    collection(db, COLLECTIONS.JOBS),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  const jobs: Job[] = []
  snapshot.forEach((doc) => {
    jobs.push({ id: doc.id, ...doc.data() } as Job)
  })
  
  return jobs
}

export async function updateJob(id: string, data: Partial<Job>) {
  await updateDoc(doc(db, COLLECTIONS.JOBS, id), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteJob(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.JOBS, id))
}

// ============ APPLICATION FUNCTIONS ============

export async function createApplication(data: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.APPLICATIONS), {
    ...data,
    appliedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  
  // Increment job's application count
  await updateDoc(doc(db, COLLECTIONS.JOBS, data.jobId), {
    applicationsCount: increment(1),
  })
  
  return docRef.id
}

export async function getApplicationsByOwner(ownerId: string, status?: string): Promise<Application[]> {
  let q = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where('ownerId', '==', ownerId),
    orderBy('appliedAt', 'desc')
  )
  
  if (status) {
    q = query(q, where('status', '==', status))
  }
  
  const snapshot = await getDocs(q)
  const applications: Application[] = []
  snapshot.forEach((doc) => {
    applications.push({ id: doc.id, ...doc.data() } as Application)
  })
  
  return applications
}

export async function getApplicationsBySeeker(seekerId: string): Promise<Application[]> {
  const q = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where('seekerId', '==', seekerId),
    orderBy('appliedAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  const applications: Application[] = []
  snapshot.forEach((doc) => {
    applications.push({ id: doc.id, ...doc.data() } as Application)
  })
  
  return applications
}

export async function updateApplicationStatus(id: string, status: Application['status'], notes?: string) {
  await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, id), {
    status,
    notes: notes || '',
    updatedAt: Timestamp.now(),
  })
  
  // If hired, increment owner's hire count
  if (status === 'hired') {
    const appDoc = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, id))
    if (appDoc.exists()) {
      const app = appDoc.data()
      await updateDoc(doc(db, COLLECTIONS.SALON_OWNERS, app.ownerId), {
        totalHires: increment(1),
      })
      
      // Update seeker status
      await updateDoc(doc(db, COLLECTIONS.JOB_SEEKERS, app.seekerId), {
        status: 'hired',
      })
    }
  }
}

// ============ ANALYTICS FUNCTIONS ============

export async function getOwnerAnalytics(ownerId: string) {
  // Get all jobs by owner
  const jobs = await getJobsByOwner(ownerId)
  
  // Get all applications for owner
  const applications = await getApplicationsByOwner(ownerId)
  
  // Calculate stats
  const totalJobs = jobs.length
  const activeJobs = jobs.filter(j => j.isActive).length
  const totalApplications = applications.length
  const pendingApplications = applications.filter(a => a.status === 'pending').length
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length
  const hired = applications.filter(a => a.status === 'hired').length
  const totalViews = jobs.reduce((sum, j) => sum + j.viewsCount, 0)
  
  return {
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    shortlisted,
    hired,
    totalViews,
    conversionRate: totalApplications > 0 ? ((hired / totalApplications) * 100).toFixed(1) : '0',
  }
}

// ============ BULK OPERATIONS (for seeding) ============

export async function bulkCreateJobSeekers(seekers: Omit<JobSeeker, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'profileViews' | 'status'>[]) {
  const batch = writeBatch(db)
  const now = Timestamp.now()
  
  seekers.forEach((seeker) => {
    const docRef = doc(collection(db, COLLECTIONS.JOB_SEEKERS))
    batch.set(docRef, {
      ...seeker,
      isVerified: false,
      profileViews: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastActive: now,
    })
  })
  
  await batch.commit()
  
  // Update counter
  await setDoc(doc(db, COLLECTIONS.ANALYTICS, 'counters'), {
    totalJobSeekers: increment(seekers.length),
  }, { merge: true })
}

export { db, auth, storage, COLLECTIONS }
