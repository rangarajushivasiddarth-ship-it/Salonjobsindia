/**
 * Registration Data Sync - Ensures data flows from browser to MongoDB
 * This module handles persistence of registration data to the backend
 */

import type { SalonProfile } from '@/lib/types'

export interface RegistrationPayload {
  name: string
  email: string
  phone: string
  password: string
  role: 'job_seeker' | 'salon_owner'
  location?: {
    latitude: number
    longitude: number
    address: string
    city?: string
    district?: string
    state?: string
    country?: string
  }
}

export interface JobSeekerRegistrationPayload extends RegistrationPayload {
  role: 'job_seeker'
  dateOfBirth?: string
  experience?: string
  skills?: string[]
  salaryExpectation?: string
  identityProofType?: string
  identityProofUrl?: string
  passportPhotoUrl?: string
}

export interface SalonOwnerRegistrationPayload extends RegistrationPayload {
  role: 'salon_owner'
  salonName?: string
  description?: string
  workingHours?: string
  logoUrl?: string
  district?: string
  area?: string
  locality?: string
}

/**
 * Register a user and sync all data to MongoDB
 */
export async function registerUser(payload: RegistrationPayload) {
  try {
    console.log('[v0] Registering user with role:', payload.role)
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }
    
    const data = await response.json()
    console.log('[v0] Registration successful:', data.userId)
    
    return data
  } catch (error) {
    console.error('[v0] Registration error:', error)
    throw error
  }
}

/**
 * Update salon owner profile in database
 */
export async function updateSalonOwnerProfile(userId: string, salonName: string, profile: Partial<SalonProfile>) {
  try {
    console.log('[v0] Updating salon owner profile:', userId)
    
    const response = await fetch('/api/salon-owners/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        salonName,
        profile
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Update failed')
    }
    
    const data = await response.json()
    console.log('[v0] Profile update successful')
    
    return data
  } catch (error) {
    console.error('[v0] Profile update error:', error)
    throw error
  }
}

/**
 * Update job seeker profile in database
 */
export async function updateJobSeekerProfile(userId: string, profileData: Record<string, any>) {
  try {
    console.log('[v0] Updating job seeker profile:', userId)
    
    const response = await fetch('/api/job-seekers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...profileData
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Update failed')
    }
    
    const data = await response.json()
    console.log('[v0] Profile update successful')
    
    return data
  } catch (error) {
    console.error('[v0] Profile update error:', error)
    throw error
  }
}

/**
 * Verify user credentials  (for login flow)
 */
export async function verifyUser(email: string, password: string, role: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('[v0] Verification error:', error)
    throw error
  }
}
