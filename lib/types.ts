// ==========================================
// FITONE - Complete Type Definitions
// ==========================================

// User Types
export type UserRole = 'job_seeker' | 'salon_owner'

export interface User {
  id: string
  email: string
  phone: string
  name?: string
  role: UserRole
  isSubscribed: boolean
  subscriptionType?: JobSeekerPlanType | SalonOwnerPlanType
  subscriptionExpiry?: Date
  shopsViewed?: number // For job seekers - tracks how many shops they've viewed
  jobPostsRemaining?: number // For salon owners - tracks remaining job posts
  profilePhoto?: string
  identityProof?: {
    type: string
    verified: boolean
  }
  createdAt: Date
}

// ==========================================
// JOB SEEKER TYPES
// ==========================================

// Resume/Profile Types
export interface Resume {
  id: string
  userId: string
  name: string
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
  passportPhoto?: string
  identityProof?: {
    type: 'Aadhar Card' | 'PAN Card' | 'Driving License' | 'Other'
    documentUrl?: string
    verified: boolean
  }
  videoIntro?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Job Seeker Subscription Plans
export type JobSeekerPlanType = 'gold' | 'premium' | 'ultra_premium'

export interface JobSeekerPlan {
  id: JobSeekerPlanType
  name: string
  price: number
  shopLimit: number | 'unlimited'
  features: string[]
  recommended?: boolean
  color: string
}

export const JOB_SEEKER_PLANS: JobSeekerPlan[] = [
  {
    id: 'gold',
    name: 'Gold',
    price: 99,
    shopLimit: 10,
    features: [
      'View up to 10 salon profiles',
      'Apply to jobs',
      'Basic chat support',
      'Email notifications'
    ],
    color: '#FFD700'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    shopLimit: 15,
    features: [
      'View up to 15 salon profiles',
      'Priority applications',
      'Full chat access',
      'Push notifications',
      'Profile boost'
    ],
    recommended: true,
    color: '#C0C0C0'
  },
  {
    id: 'ultra_premium',
    name: 'Ultra Premium',
    price: 349,
    shopLimit: 'unlimited',
    features: [
      'View unlimited salon profiles',
      'Top priority applications',
      'Direct call access to owners',
      'Verified badge',
      'Featured profile',
      'Dedicated support'
    ],
    color: '#B76E79'
  }
]

// ==========================================
// SALON OWNER TYPES
// ==========================================

export type SalonOwnerPlanType = 'single_post' | 'triple_post' | 'bulk_post'

export interface SalonOwnerPlan {
  id: SalonOwnerPlanType
  name: string
  price: number
  jobPosts: number
  validityDays: number
  features: string[]
  recommended?: boolean
}

export const SALON_OWNER_PLANS: SalonOwnerPlan[] = [
  {
    id: 'single_post',
    name: 'Single Post',
    price: 99,
    jobPosts: 1,
    validityDays: 30,
    features: [
      '1 Job posting',
      'Valid for 30 days',
      'View applicant profiles',
      'In-app chat'
    ]
  },
  {
    id: 'triple_post',
    name: 'Triple Post',
    price: 249,
    jobPosts: 3,
    validityDays: 45,
    features: [
      '3 Job postings',
      'Valid for 45 days',
      'Priority listing',
      'Applicant filters',
      'Chat + Call access'
    ],
    recommended: true
  },
  {
    id: 'bulk_post',
    name: 'Bulk Post',
    price: 499,
    jobPosts: 10,
    validityDays: 90,
    features: [
      '10 Job postings',
      'Valid for 90 days',
      'Featured listings',
      'Advanced analytics',
      'Priority support',
      'Bulk hiring tools'
    ]
  }
]

// Salon Types
export interface Salon {
  id: string
  ownerId: string
  name: string
  description?: string
  photos?: string[]
  location: {
    lat: number
    lng: number
    address: string
    area: string
    city: string
  }
  contact: string
  whatsapp?: string
  email?: string
  rating?: number
  reviewCount?: number
  establishedYear?: number
  employeeCount?: number
  services?: string[]
  openingHours?: {
    open: string
    close: string
    days: string[]
  }
  isVerified: boolean
  createdAt: Date
}

// Job Types
export interface Job {
  id: string
  salonId: string
  salonName: string
  salonPhoto?: string
  role: BeautyRole
  salary: string
  salaryType: 'monthly' | 'weekly' | 'daily' | 'commission'
  experience: string
  experienceYears?: number
  location: {
    lat: number
    lng: number
    address: string
    area: string
    city: string
  }
  contact: string
  whatsapp?: string
  description?: string
  requirements?: string[]
  benefits?: string[]
  timing?: string
  vacancies?: number
  gender?: 'male' | 'female' | 'any'
  accommodation?: boolean
  foodProvided?: boolean
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  isPremium?: boolean
  applicationsCount?: number
}

// ==========================================
// BEAUTY/SALON JOB ROLES
// ==========================================

export type BeautyRole = 
  | 'Hair Stylist'
  | 'Senior Hair Stylist'
  | 'Junior Hair Stylist'
  | 'Hair Colorist'
  | 'Makeup Artist'
  | 'Bridal Makeup Artist'
  | 'Nail Technician'
  | 'Nail Artist'
  | 'Spa Therapist'
  | 'Massage Therapist'
  | 'Beautician'
  | 'Senior Beautician'
  | 'Skin Care Specialist'
  | 'Esthetician'
  | 'Barber'
  | 'Master Barber'
  | 'Mehendi Artist'
  | 'Henna Artist'
  | 'Tattoo Artist'
  | 'Eyebrow Specialist'
  | 'Lash Technician'
  | 'Salon Manager'
  | 'Salon Receptionist'
  | 'Salon Assistant'
  | 'Trainee'
  | 'Other'

export const BEAUTY_ROLES: { role: BeautyRole; category: string; icon: string }[] = [
  // Hair
  { role: 'Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Senior Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Junior Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Hair Colorist', category: 'Hair', icon: '🎨' },
  // Makeup
  { role: 'Makeup Artist', category: 'Makeup', icon: '💄' },
  { role: 'Bridal Makeup Artist', category: 'Makeup', icon: '👰' },
  // Nails
  { role: 'Nail Technician', category: 'Nails', icon: '💅' },
  { role: 'Nail Artist', category: 'Nails', icon: '💅' },
  // Spa & Wellness
  { role: 'Spa Therapist', category: 'Spa', icon: '🧖' },
  { role: 'Massage Therapist', category: 'Spa', icon: '💆' },
  // Beauty
  { role: 'Beautician', category: 'Beauty', icon: '✨' },
  { role: 'Senior Beautician', category: 'Beauty', icon: '✨' },
  { role: 'Skin Care Specialist', category: 'Beauty', icon: '🧴' },
  { role: 'Esthetician', category: 'Beauty', icon: '🧴' },
  // Barber
  { role: 'Barber', category: 'Barber', icon: '💈' },
  { role: 'Master Barber', category: 'Barber', icon: '💈' },
  // Art
  { role: 'Mehendi Artist', category: 'Art', icon: '🖌️' },
  { role: 'Henna Artist', category: 'Art', icon: '🖌️' },
  { role: 'Tattoo Artist', category: 'Art', icon: '🖋️' },
  // Specialty
  { role: 'Eyebrow Specialist', category: 'Specialty', icon: '👁️' },
  { role: 'Lash Technician', category: 'Specialty', icon: '👁️' },
  // Management
  { role: 'Salon Manager', category: 'Management', icon: '👔' },
  { role: 'Salon Receptionist', category: 'Management', icon: '📞' },
  { role: 'Salon Assistant', category: 'Support', icon: '🙋' },
  { role: 'Trainee', category: 'Support', icon: '📚' },
  { role: 'Other', category: 'Other', icon: '💼' },
]

export const ROLE_CATEGORIES = [
  'All',
  'Hair',
  'Makeup',
  'Nails',
  'Spa',
  'Beauty',
  'Barber',
  'Art',
  'Specialty',
  'Management',
  'Support'
]

// ==========================================
// CHAT & MESSAGING TYPES
// ==========================================

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderPhoto?: string
  content: string
  type: 'text' | 'image' | 'contact' | 'job_card'
  contactInfo?: {
    phone: string
    whatsapp?: string
  }
  jobInfo?: {
    jobId: string
    role: string
    salary: string
  }
  isRead: boolean
  createdAt: Date
}

export interface Conversation {
  id: string
  participants: {
    id: string
    name: string
    photo?: string
    role: UserRole
  }[]
  jobId?: string
  jobRole?: string
  lastMessage?: ChatMessage
  unreadCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export type NotificationType = 
  | 'new_job'
  | 'application_viewed'
  | 'application_accepted'
  | 'new_message'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'profile_viewed'
  | 'new_applicant'
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: {
    jobId?: string
    applicationId?: string
    conversationId?: string
    senderId?: string
  }
  isRead: boolean
  createdAt: Date
}

// ==========================================
// SUBSCRIPTION & PAYMENT TYPES
// ==========================================

export interface Subscription {
  id: string
  userId: string
  userPhone?: string
  userName?: string
  userRole: UserRole
  planType: JobSeekerPlanType | SalonOwnerPlanType
  planName: string
  amount: number
  screenshotUrl?: string
  transactionId?: string
  paymentMethod: 'upi' | 'card' | 'netbanking'
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  shopLimit?: number | 'unlimited'
  shopsViewed?: number
  jobPostsTotal?: number
  jobPostsUsed?: number
  createdAt: Date
  approvedAt?: Date
  expiresAt?: Date
}

// ==========================================
// APPLICATION TYPES
// ==========================================

export interface Application {
  id: string
  jobId: string
  jobRole: string
  salonId: string
  salonName: string
  userId: string
  userName: string
  userPhoto?: string
  resumeId: string
  status: 'pending' | 'viewed' | 'shortlisted' | 'contacted' | 'rejected' | 'hired'
  notes?: string
  contactShared: boolean
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// ADMIN/STATS TYPES
// ==========================================

export interface AdminStats {
  totalJobSeekers: number
  totalSalonOwners: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  pendingSubscriptions: number
  activeSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
}

export interface AppSettings {
  qrCodeUrl: string
  radiusKm: number
  paymentInstructions: string
  subscriptionDurationDays: number
  supportEmail: string
  supportPhone: string
  appVersion: string
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ==========================================
// FILTER TYPES
// ==========================================

export interface JobFilters {
  role?: BeautyRole | 'All'
  category?: string
  salaryMin?: number
  salaryMax?: number
  experience?: string
  location?: {
    lat: number
    lng: number
    radiusKm: number
  }
  city?: string
  area?: string
  gender?: 'male' | 'female' | 'any'
  sortBy?: 'newest' | 'salary_high' | 'salary_low' | 'distance'
}

export interface CandidateFilters {
  role?: BeautyRole | 'All'
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  location?: {
    lat: number
    lng: number
    radiusKm: number
  }
  city?: string
  skills?: string[]
  hasVideo?: boolean
  isVerified?: boolean
  sortBy?: 'newest' | 'experience' | 'rating'
}
