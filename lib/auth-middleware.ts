import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export interface AuthPayload {
  userId: string
  email: string
  role: 'job_seeker' | 'salon_owner' | 'admin'
  iat: number
  exp: number
}

/**
 * Verify JWT token from request headers
 * Returns auth payload if valid, null if invalid
 */
export async function verifyAuth(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] No auth header or invalid format')
      return null
    }

    const token = authHeader.slice(7)
    const verified = await jwtVerify(token, secret)
    return verified.payload as AuthPayload
  } catch (error) {
    console.log('[v0] Token verification failed:', error)
    return null
  }
}

/**
 * Require authentication and optional role check
 * Usage: 
 *   const auth = await requireAuth(request)
 *   const admin = await requireAuth(request, 'admin')
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: 'admin' | 'salon_owner' | 'job_seeker'
): Promise<{ success: false; response: NextResponse } | { success: true; auth: AuthPayload }> {
  const auth = await verifyAuth(request)

  if (!auth) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      )
    }
  }

  if (requiredRole && auth.role !== requiredRole) {
    console.log(`[v0] Role mismatch: required ${requiredRole}, got ${auth.role}`)
    return {
      success: false,
      response: NextResponse.json(
        { error: `Forbidden: Requires ${requiredRole} role` },
        { status: 403 }
      )
    }
  }

  return { success: true, auth }
}
