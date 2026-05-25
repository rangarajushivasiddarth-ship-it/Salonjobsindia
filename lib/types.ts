// ==========================================
// SALON JOBS INDIA - Complete Type Definitions
// ==========================================

// User Types
export type UserRole = 'job_seeker' | 'salon_owner' | 'employer'

export interface User {
  id: string
  email: string
  phone: string
  name?: string
  role: UserRole
  isSubscribed: boolean
  subscriptionType?: JobSeekerPlanType | SalonOwnerPlanType
  subscriptionExpiry?: Date
  shopsViewed?: number
  jobPostsRemaining?: number
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
  passportPhoto?: {
    url?: string
    uploaded: boolean
  }
  identityProof?: {
    type: 'Aadhar Card' | 'PAN Card' | 'Driving License' | 'Other'
    documentUrl?: string
    uploaded: boolean
    verified: boolean
  }
  videoIntro?: string
  isActive?: boolean
  availabilityStatus?: 'actively_looking' | 'open_to_opportunities' | 'not_looking'
  createdAt: Date
  updatedAt: Date
}

export type JobSeekerPlanType = 'gold' | 'premium' | 'ultra_premium' | 'unlimited'

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
    id: 'unlimited',
    name: 'Premium Access',
    price: 99,
    shopLimit: 'unlimited',
    features: [
      'View all salon job listings',
      'Unlock salon phone numbers',
      'Apply to unlimited jobs',
      'Chat with salon owners',
      'Priority support',
      'Valid for 30 days'
    ],
    recommended: true,
    color: '#FFD700'
  }
]

// ==========================================
// SALON OWNER TYPES
// ==========================================

export type SalonOwnerPlanType = 'job_publishing' | 'verified_badge_1m' | 'verified_badge_3m' | 'contact_pack_10' | 'contact_pack_50'

export interface SalonOwnerPlan {
  id: SalonOwnerPlanType
  name: string
  price: number
  validityDays: number
  contactCredits?: number
  features: string[]
  recommended?: boolean
}

export const SALON_OWNER_PLANS: SalonOwnerPlan[] = [
  {
    id: 'job_publishing',
    name: 'Job Publishing Plan',
    price: 499,
    validityDays: 30,
    contactCredits: 30,
    features: [
      '1 live job post for 30 days',
      '30 contact credits to unlock candidates',
      'Edit job up to 3 times',
      'Delete job anytime',
      'Receive unlimited applications',
      'View applicant profiles'
    ],
    recommended: true
  },
]

// Contact Credit Packs for Salon Owners
export interface ContactCreditPack {
  id: string
  name: string
  credits: number
  price: number
  features: string[]
  recommended?: boolean
}

export const CONTACT_CREDIT_PACKS: ContactCreditPack[] = [
  {
    id: 'credit_pack_15',
    name: '15 Credits Pack',
    credits: 15,
    price: 199,
    features: [
      'Unlock 15 job seeker contacts',
      '1 credit = 1 contact unlock',
      'Never expires',
      'Instant activation after approval'
    ]
  },
  {
    id: 'credit_pack_50',
    name: '50 Credits Pack',
    credits: 50,
    price: 499,
    features: [
      'Unlock 50 job seeker contacts',
      '1 credit = 1 contact unlock',
      'Never expires',
      'Instant activation after approval',
      'Best value - save Rs.149'
    ],
    recommended: true
  }
]

// Salon Profile
export interface SalonProfile {
  id: string
  ownerId: string
  salonName: string
  ownerName: string
  mobile: string
  email?: string
  logoUrl?: string
  address: string
  state: string
  city: string
  area: string
  locality: string
  workingHours: string
  description?: string
  isVerified: boolean
  verifiedUntil?: Date
  contactCredits: number
  unlockedCandidates: string[] // Array of candidate IDs
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// JOB TYPES
// ==========================================

export type JobPostStatus = 
  | 'draft'
  | 'pending_payment'
  | 'pending_approval'
  | 'live'
  | 'expired'
  | 'deleted'

export interface Job {
  id: string
  salonId: string
  salonName: string
  salonLogo?: string
  salonMobile: string
  role: string
  customRole?: string
  skills: string[]
  customSkills?: string[]
  salaryType: 'fixed' | 'range'
  salaryFixed?: string
  salaryRange?: string
  experience: string
  jobType: 'full_time' | 'part_time'
  description: string
  location: {
    lat: number
    lng: number
    address: string
    state: string
    city: string
    area: string
    locality: string
  }
  contact: string
  status: JobPostStatus
  editsUsed: number
  maxEdits: number
  viewsCount: number
  applicationsCount: number
  isVerified: boolean
  paymentId?: string
  paymentScreenshot?: string
  paymentSubmittedAt?: Date
  paymentApprovedAt?: Date
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
}

// ==========================================
// ROLE & SKILL LIBRARIES
// ==========================================

export const SALON_ROLES = [
  'Apprentice',
  'Assistant Beautician',
  'Assistant Hair Stylist',
  'Junior Hair Stylist',
  'Senior Hair Stylist',
  'Hair Stylist',
  'Hair Artist',
  'Hair Technician',
  'Hair Color Specialist',
  'Hair Extension Specialist',
  'Hair Treatment Specialist',
  'Keratin Specialist',
  'Smoothening Specialist',
  'Rebonding Specialist',
  'Hair Spa Specialist',
  'Scalp Treatment Specialist',
  'Barber',
  "Men's Grooming Specialist",
  'Beard Grooming Specialist',
  'Bridal Makeup Artist',
  'Party Makeup Artist',
  'HD Makeup Artist',
  'Airbrush Makeup Artist',
  'Celebrity Makeup Artist',
  'Makeup Artist',
  'Beautician',
  'Senior Beautician',
  'Skin Specialist',
  'Facial Specialist',
  'Waxing Specialist',
  'Threading Specialist',
  'Eyebrow Specialist',
  'Lash Technician',
  'Nail Artist',
  'Nail Technician',
  'Gel Nail Specialist',
  'Acrylic Nail Specialist',
  'Spa Therapist',
  'Massage Therapist',
  'Head Massage Specialist',
  'Body Massage Specialist',
  'Mehendi Artist',
  'Bridal Mehendi Specialist',
  'Tattoo Artist',
  'Receptionist',
  'Customer Support Executive',
  'Salon Manager',
  'Branch Manager',
  'Academy Trainer',
  'Beauty Trainer',
  'Salon Consultant',
] as const

export const SALON_SKILLS = [
  'Hair Cutting',
  'Hair Coloring',
  'Hair Styling',
  'Hair Wash',
  'Blow Dry',
  'Hair Spa',
  'Hair Treatment',
  'Dandruff Treatment',
  'Scalp Treatment',
  'Keratin Smoothening',
  'Smoothening',
  'Rebonding',
  'Perm',
  'Hair Extensions',
  'Balayage Highlights',
  'Global Color',
  'Highlights',
  'Root Touch Up',
  'Beard Styling',
  'Beard Grooming',
  'Shaving',
  "Men's Haircut",
  "Women's Haircut",
  "Kids Haircut",
  'Bridal Makeup',
  'Party Makeup',
  'HD Makeup',
  'Airbrush Makeup',
  'Engagement Makeup',
  'Reception Makeup',
  'Makeup Consultation',
  'Saree Draping',
  'Manicure',
  'Pedicure',
  'Gel Nails',
  'Acrylic Nails',
  'Nail Art',
  'Nail Extensions',
  'Facial',
  'Clean Up',
  'Detan',
  'Anti-aging Facial',
  'Skin Analysis',
  'Threading',
  'Eyebrow Shaping',
  'Waxing',
  'Full Body Waxing',
  'Body Polishing',
  'Lash Extensions',
  'Body Massage',
  'Head Massage',
  'Foot Massage',
  'Spa Treatment',
  'Mehendi Design',
  'Bridal Mehendi',
  'Product Knowledge',
  'Client Consultation',
  'Customer Handling',
  'Salon Hygiene',
  'Sanitization',
  'Appointment Handling',
  'Salon Management',
  'Team Handling',
  'Training Juniors',
] as const

export const SALARY_RANGES = [
  '₹10,000–15,000',
  '₹15,000–25,000',
  '₹25,000–40,000',
  '₹40,000–60,000',
  '₹60,000+',
  'Negotiable',
] as const

export const EXPERIENCE_OPTIONS = [
  'Fresher',
  '0–1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10+ years',
] as const

export type BeautyRole = typeof SALON_ROLES[number] | string

export const BEAUTY_ROLES: { role: BeautyRole; category: string; icon: string }[] = [
  { role: 'Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Senior Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Junior Hair Stylist', category: 'Hair', icon: '💇' },
  { role: 'Hair Color Specialist', category: 'Hair', icon: '🎨' },
  { role: 'Makeup Artist', category: 'Makeup', icon: '💄' },
  { role: 'Bridal Makeup Artist', category: 'Makeup', icon: '👰' },
  { role: 'Nail Technician', category: 'Nails', icon: '💅' },
  { role: 'Nail Artist', category: 'Nails', icon: '💅' },
  { role: 'Spa Therapist', category: 'Spa', icon: '🧖' },
  { role: 'Massage Therapist', category: 'Spa', icon: '💆' },
  { role: 'Beautician', category: 'Beauty', icon: '✨' },
  { role: 'Senior Beautician', category: 'Beauty', icon: '✨' },
  { role: 'Skin Specialist', category: 'Beauty', icon: '🧴' },
  { role: 'Barber', category: 'Barber', icon: '💈' },
  { role: 'Mehendi Artist', category: 'Art', icon: '🖌️' },
  { role: 'Tattoo Artist', category: 'Art', icon: '🖋️' },
  { role: 'Eyebrow Specialist', category: 'Specialty', icon: '👁️' },
  { role: 'Lash Technician', category: 'Specialty', icon: '👁️' },
  { role: 'Salon Manager', category: 'Management', icon: '👔' },
  { role: 'Receptionist', category: 'Management', icon: '📞' },
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
]

// ==========================================
// APPLICATION TYPES
// ==========================================

export type ApplicationStatus = 'applied' | 'viewed' | 'shortlisted' | 'selected' | 'rejected'

export interface Application {
  id: string
  jobId: string
  jobRole: string
  salonId: string
  salonName: string
  candidateId: string
  candidateName: string
  candidatePhoto?: string
  candidatePhone?: string
  candidateExperience: string
  candidateSkills: string[]
  candidateLocation: string
  candidateAvailability?: 'actively_looking' | 'open_to_opportunities' | 'not_looking'
  resumeId?: string
  status: ApplicationStatus
  isContactUnlocked: boolean
  matchPercentage?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// ALERT TYPES
// ==========================================

export type AlertType = 
  | 'payment_pending'
  | 'payment_approved'
  | 'payment_rejected'
  | 'job_live'
  | 'job_expired'
  | 'verified_activated'
  | 'verified_expired'
  | 'new_application'
  | 'candidate_unlocked'
  | 'credits_low'
  | 'subscription_expiring'
  | 'contact_pack_approved'
  | 'system'

export interface Alert {
  id: string
  userId: string
  type: AlertType
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
}

// ==========================================
// PAYMENT TYPES
// ==========================================

export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type PaymentType = 'job_publishing' | 'verified_badge' | 'contact_pack'

export interface Payment {
  id: string
  userId: string
  userName?: string
  userPhone?: string
  salonName?: string
  type: PaymentType
  planId: SalonOwnerPlanType
  amount: number
  screenshotUrl?: string
  status: PaymentStatus
  jobId?: string // For job publishing payments
  contactCredits?: number // For contact pack payments
  validityDays: number
  submittedAt: Date
  processedAt?: Date
  processedBy?: string
  rejectionReason?: string
}

// ==========================================
// SUBSCRIPTION TYPES
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
  contactCredits?: number
  createdAt: Date
  approvedAt?: Date
  expiresAt?: Date
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
  | 'payment_approved'
  | 'payment_rejected'

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
// CHAT TYPES
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
  availability?: 'actively_looking' | 'open_to_opportunities' | 'not_looking'
  hasVideo?: boolean
  isVerified?: boolean
  sortBy?: 'newest' | 'experience' | 'match'
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
// ADMIN TYPES
// ==========================================

export interface AdminStats {
  totalUsers: number
  totalJobSeekers: number
  totalSalonOwners: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  pendingPayments: number
  pendingApprovals: number
  activeSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
}

export interface AppSettings {
  qrCodeUrl: string
  upiId: string
  radiusKm: number
  paymentInstructions: string
  subscriptionDurationDays: number
  supportEmail: string
  supportPhone: string
  appVersion: string
}
