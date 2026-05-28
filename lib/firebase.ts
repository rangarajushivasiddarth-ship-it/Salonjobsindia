'use client'

// Check if Firebase is configured
const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
)

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
  createdAt: Date
  updatedAt: Date
  lastActive: Date
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
  appliedAt: Date
  updatedAt: Date
  notes: string
}

// ============ MOCK DATA STORE (for demo without Firebase) ============
const MOCK_STORAGE_KEY = 'fitonze_mock_db'

interface MockDatabase {
  jobSeekers: JobSeeker[]
  salonOwners: SalonOwner[]
  jobs: Job[]
  applications: Application[]
  counters: {
    totalJobSeekers: number
    totalSalonOwners: number
    totalJobs: number
    totalApplications: number
  }
}

function getInitialMockData(): MockDatabase {
  // Start with empty data - only real registered users/data should be shown
  // No fake/mock data - everything comes from actual user registrations
  return {
    jobSeekers: [],
    salonOwners: [],
    jobs: [],
    applications: [],
    counters: {
      totalJobSeekers: 0,
      totalSalonOwners: 0,
      totalJobs: 0,
      totalApplications: 0,
    },
  }
}

function getMockDb(): MockDatabase {
  if (typeof window === 'undefined') return getInitialMockData()
  
  const stored = localStorage.getItem(MOCK_STORAGE_KEY)
  if (stored) {
    try {
      const data = JSON.parse(stored)
      // Convert date strings back to Date objects
      data.jobSeekers = data.jobSeekers?.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        lastActive: new Date(s.lastActive),
      })) || []
      return data
    } catch {
      return getInitialMockData()
    }
  }
  const initial = getInitialMockData()
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initial))
  return initial
}

function saveMockDb(db: MockDatabase) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db))
}

// ============ DATABASE SERVICE ============

export const DatabaseService = {
  // Job Seekers
  async createJobSeeker(data: Omit<JobSeeker, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'profileViews' | 'status'>): Promise<string> {
    const db = getMockDb()
    const id = `seeker_${Date.now()}`
    const newSeeker: JobSeeker = {
      ...data,
      id,
      isVerified: false,
      profileViews: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date(),
    }
    db.jobSeekers.unshift(newSeeker)
    db.counters.totalJobSeekers++
    saveMockDb(db)
    return id
  },

  async getJobSeeker(id: string): Promise<JobSeeker | null> {
    const db = getMockDb()
    return db.jobSeekers.find(s => s.id === id) || null
  },

  async updateJobSeeker(id: string, data: Partial<JobSeeker>): Promise<void> {
    const db = getMockDb()
    const index = db.jobSeekers.findIndex(s => s.id === id)
    if (index !== -1) {
      db.jobSeekers[index] = { ...db.jobSeekers[index], ...data, updatedAt: new Date() }
      saveMockDb(db)
    }
  },

  async getJobSeekers(
    filters?: {
      role?: string
      experience?: string
      skills?: string[]
      location?: string
      status?: string
      isPremium?: boolean
      searchQuery?: string
    },
    page = 1,
    pageSize = 20
  ): Promise<{ seekers: JobSeeker[]; total: number; hasMore: boolean }> {
    const db = getMockDb()
    let filtered = [...db.jobSeekers]

    if (filters?.role) {
      filtered = filtered.filter(s => s.role.toLowerCase().includes(filters.role!.toLowerCase()))
    }
    if (filters?.experience) {
      filtered = filtered.filter(s => s.experience === filters.experience)
    }
    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status)
    }
    if (filters?.isPremium !== undefined) {
      filtered = filtered.filter(s => s.isPremium === filters.isPremium)
    }
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query) ||
        s.location.address.toLowerCase().includes(query)
      )
    }

    const start = (page - 1) * pageSize
    const paginated = filtered.slice(start, start + pageSize)

    return {
      seekers: paginated,
      total: db.counters.totalJobSeekers,
      hasMore: start + pageSize < filtered.length,
    }
  },

  async getTotalJobSeekers(): Promise<number> {
    const db = getMockDb()
    return db.counters.totalJobSeekers
  },

  // Jobs
  async createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount'>): Promise<string> {
    const db = getMockDb()
    const id = `job_${Date.now()}`
    const newJob: Job = {
      ...data,
      id,
      applicationsCount: 0,
      viewsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    db.jobs.unshift(newJob)
    db.counters.totalJobs++
    saveMockDb(db)
    return id
  },

  async getJobsByOwner(ownerId: string): Promise<Job[]> {
    const db = getMockDb()
    return db.jobs.filter(j => j.ownerId === ownerId)
  },

  async updateJob(id: string, data: Partial<Job>): Promise<void> {
    const db = getMockDb()
    const index = db.jobs.findIndex(j => j.id === id)
    if (index !== -1) {
      db.jobs[index] = { ...db.jobs[index], ...data, updatedAt: new Date() }
      saveMockDb(db)
    }
  },

  async deleteJob(id: string): Promise<void> {
    const db = getMockDb()
    db.jobs = db.jobs.filter(j => j.id !== id)
    saveMockDb(db)
  },

  // Applications
  async createApplication(data: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>): Promise<string> {
    const db = getMockDb()
    const id = `app_${Date.now()}`
    const newApp: Application = {
      ...data,
      id,
      appliedAt: new Date(),
      updatedAt: new Date(),
    }
    db.applications.unshift(newApp)
    db.counters.totalApplications++
    
    // Increment job application count
    const jobIndex = db.jobs.findIndex(j => j.id === data.jobId)
    if (jobIndex !== -1) {
      db.jobs[jobIndex].applicationsCount++
    }
    
    saveMockDb(db)
    return id
  },

  async getApplicationsByOwner(ownerId: string, status?: string): Promise<Application[]> {
    const db = getMockDb()
    let apps = db.applications.filter(a => a.ownerId === ownerId)
    if (status) {
      apps = apps.filter(a => a.status === status)
    }
    return apps
  },

  async updateApplicationStatus(id: string, status: Application['status'], notes?: string): Promise<void> {
    const db = getMockDb()
    const index = db.applications.findIndex(a => a.id === id)
    if (index !== -1) {
      db.applications[index] = {
        ...db.applications[index],
        status,
        notes: notes || '',
        updatedAt: new Date(),
      }
      saveMockDb(db)
    }
  },

  // Analytics
  async getOwnerAnalytics(ownerId: string) {
    const db = getMockDb()
    const jobs = db.jobs.filter(j => j.ownerId === ownerId)
    const applications = db.applications.filter(a => a.ownerId === ownerId)

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.isActive).length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      hired: applications.filter(a => a.status === 'hired').length,
      totalViews: jobs.reduce((sum, j) => sum + j.viewsCount, 0),
      conversionRate: applications.length > 0 
        ? ((applications.filter(a => a.status === 'hired').length / applications.length) * 100).toFixed(1) 
        : '0',
    }
  },

  // Platform Stats (for admin/display)
  async getPlatformStats() {
    const db = getMockDb()
    return {
      totalJobSeekers: db.counters.totalJobSeekers,
      totalSalonOwners: db.counters.totalSalonOwners,
      totalJobs: db.counters.totalJobs,
      totalApplications: db.counters.totalApplications,
      totalHires: Math.floor(db.counters.totalApplications * 0.15), // ~15% conversion
    }
  },
}

export { isFirebaseConfigured }
