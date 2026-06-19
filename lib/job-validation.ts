import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, key)
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate job data before posting
 * CRITICAL: Prevents invalid jobs from being created
 */
export async function validateJobData(jobData: any): Promise<ValidationResult> {
  // Required fields
  if (!jobData.title || jobData.title.trim().length === 0) {
    return { valid: false, error: 'Job title is required' }
  }

  if (jobData.title.length > 200) {
    return { valid: false, error: 'Job title must be 200 characters or less' }
  }

  if (!jobData.description || jobData.description.trim().length === 0) {
    return { valid: false, error: 'Job description is required' }
  }

  if (jobData.description.length > 5000) {
    return { valid: false, error: 'Job description must be 5000 characters or less' }
  }

  // Salary validation
  if (jobData.salary_min !== undefined && jobData.salary_min < 0) {
    return { valid: false, error: 'Minimum salary cannot be negative' }
  }

  if (jobData.salary_max !== undefined && jobData.salary_max < 0) {
    return { valid: false, error: 'Maximum salary cannot be negative' }
  }

  if (
    jobData.salary_min !== undefined &&
    jobData.salary_max !== undefined &&
    jobData.salary_min > jobData.salary_max
  ) {
    return { valid: false, error: 'Minimum salary cannot be greater than maximum salary' }
  }

  // Location validation
  if (!jobData.location_city || jobData.location_city.trim().length === 0) {
    return { valid: false, error: 'Job location city is required' }
  }

  // Payment validation
  if (!jobData.payment_plan) {
    return { valid: false, error: 'Payment plan is required' }
  }

  if (!jobData.payment_amount || jobData.payment_amount <= 0) {
    return { valid: false, error: 'Valid payment amount is required' }
  }

  return { valid: true }
}

/**
 * Check if job is duplicate based on owner, title, and location
 * CRITICAL: Prevents salon owners from posting identical jobs
 */
export async function checkDuplicateJob(
  ownerId: string,
  title: string,
  locationCity: string
): Promise<{
  isDuplicate: boolean
  error?: string
}> {
  try {
    const supabase = getSupabaseClient()

    // Normalize title for comparison
    const normalizedTitle = title.toLowerCase().trim()

    // Check for similar job posted in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .eq('owner_id', ownerId)
      .ilike('title', `%${normalizedTitle}%`)
      .ilike('location_city', `%${locationCity}%`)
      .gte('created_at', sevenDaysAgo)
      .limit(1)

    if (error) {
      console.error('[v0] Error checking duplicate jobs:', error)
      return { isDuplicate: false, error: error.message }
    }

    if (data && data.length > 0) {
      console.warn('[v0] Duplicate job detected for owner:', ownerId)
      return {
        isDuplicate: true,
        error: 'You have posted a similar job in the last 7 days. Please reuse or update that job instead.'
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('[v0] Exception checking duplicate jobs:', error)
    return {
      isDuplicate: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check for duplicate applications
 * CRITICAL: Prevents job seekers from applying multiple times to same job
 */
export async function checkDuplicateApplication(
  seekerId: string,
  jobId: string
): Promise<{
  isDuplicate: boolean
  error?: string
}> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('seeker_id', seekerId)
      .eq('job_id', jobId)
      .limit(1)

    if (error) {
      console.error('[v0] Error checking duplicate applications:', error)
      return { isDuplicate: false, error: error.message }
    }

    if (data && data.length > 0) {
      console.warn('[v0] Duplicate application detected:', seekerId, jobId)
      return {
        isDuplicate: true,
        error: 'You have already applied for this job.'
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('[v0] Exception checking duplicate applications:', error)
    return {
      isDuplicate: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate password strength
 * CRITICAL: Enforces strong passwords
 */
export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*)' }
  }

  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

/**
 * Validate phone format (Indian)
 */
export function validatePhone(phone: string): ValidationResult {
  const phoneRegex = /^[6-9]\d{9}$/
  const cleanPhone = phone.replace(/\D/g, '')
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9.' }
  }
  return { valid: true }
}
