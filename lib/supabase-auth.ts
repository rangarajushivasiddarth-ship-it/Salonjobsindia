import { createClient } from '@supabase/supabase-js'
import { hash, compare } from 'bcryptjs'

// Initialize Supabase client for auth operations
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, key)
}

export interface UserProfile {
  id: string
  email: string
  phone: string
  name: string
  role: 'job_seeker' | 'salon_owner'
  created_at: string
  updated_at: string
}

export interface AuthResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Register a new user in Supabase
 * CRITICAL: This replaces MongoDB auth with Supabase to ensure consistency
 */
export async function registerUser(
  email: string,
  phone: string,
  name: string,
  password: string,
  role: 'job_seeker' | 'salon_owner'
): Promise<AuthResult> {
  console.log('[v0] [Auth] Registering user:', email, 'Role:', role)

  try {
    const supabase = getSupabaseClient()

    // Validate inputs
    if (!email || !phone || !name || !password || !role) {
      return {
        success: false,
        error: 'Missing required fields'
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single()

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email or phone already exists'
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          phone,
          name,
          password: hashedPassword,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] [Auth] Registration error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('[v0] [Auth] User registered successfully:', data.id)

    return {
      success: true,
      data: {
        id: data.id,
        email: data.email,
        role: data.role
      }
    }
  } catch (error) {
    console.error('[v0] [Auth] Exception during registration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Login user - verify password and return user data
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  console.log('[v0] [Auth] Login attempt for:', email)

  try {
    const supabase = getSupabaseClient()

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      console.log('[v0] [Auth] User not found:', email)
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    // Verify password
    const passwordValid = await compare(password, user.password)

    if (!passwordValid) {
      console.log('[v0] [Auth] Invalid password for user:', email)
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    console.log('[v0] [Auth] User logged in successfully:', email)

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    }
  } catch (error) {
    console.error('[v0] [Auth] Exception during login:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      phone: data.phone,
      name: data.name,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('[v0] [Auth] Error fetching user:', error)
    return null
  }
}

/**
 * Verify user email (optional for future implementation)
 */
export async function verifyUserEmail(userId: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] [Auth] Error verifying email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
