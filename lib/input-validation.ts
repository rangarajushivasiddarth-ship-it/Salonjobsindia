import { z } from 'zod'

/**
 * Input validation schemas
 * Used across all API routes to prevent SQL injection, XSS, and invalid data
 */

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['job_seeker', 'salon_owner'], {
    errorMap: () => ({ message: 'Role must be job_seeker or salon_owner' })
  })
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required')
})

// Job schemas
export const createJobSchema = z.object({
  salonId: z.string().min(1, 'Salon ID required'),
  salonName: z.string().min(1, 'Salon name required'),
  role: z.string().min(1, 'Job role required'),
  skills: z.array(z.string()).default([]),
  description: z.string().max(5000, 'Description too long'),
  salaryType: z.enum(['fixed', 'range']),
  salaryFixed: z.string().optional(),
  salaryRange: z.string().optional(),
  experience: z.string().min(1),
  jobType: z.enum(['full_time', 'part_time']).default('full_time'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1),
    state: z.string(),
    city: z.string(),
    area: z.string(),
    locality: z.string()
  }),
  contact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits')
})

export const updateJobSchema = createJobSchema.partial()

// Payment schemas
export const createPaymentSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['job_publishing', 'verified_badge', 'contact_pack']),
  planId: z.string().min(1),
  amount: z.number().positive('Amount must be positive'),
  screenshotUrl: z.string().url().optional(),
  jobId: z.string().optional(),
  validityDays: z.number().positive().default(30)
})

export const approvePaymentSchema = z.object({
  paymentId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  adminId: z.string().min(1),
  reason: z.string().optional()
})

// Application schemas
export const createApplicationSchema = z.object({
  jobId: z.string().min(1),
  userId: z.string().min(1),
  resumeUrl: z.string().url().optional(),
  coverLetter: z.string().max(2000).optional()
})

// Resume/Profile schemas
export const updateResumeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.string().min(1).optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  salaryExpectation: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1)
  }).optional()
})

// Location schemas
export const saveLocationSchema = z.object({
  userId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional()
})

/**
 * Safely parse and validate request body
 * Returns parsed data or error response
 */
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    return { success: false, errors }
  }

  return { success: true, data: result.data as T }
}
