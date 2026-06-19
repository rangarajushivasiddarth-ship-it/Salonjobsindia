import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

// Use a strong secret for JWT verification - should be in environment variables
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-super-secret-key-change-in-production'

if (JWT_SECRET === 'your-super-secret-key-change-in-production') {
  console.warn('[v0] WARNING: Using default JWT secret. Set ADMIN_JWT_SECRET in environment variables for production.')
}

interface AdminToken {
  sub: string // Admin user ID
  email: string
  role: 'admin' | 'super_admin'
  iat: number // Issued at
  exp: number // Expiration
}

/**
 * Verify admin JWT token from Authorization header
 * Expects: Authorization: Bearer <jwt_token>
 */
export async function verifyAdminToken(request: NextRequest): Promise<{
  valid: boolean
  admin?: AdminToken
  error?: string
}> {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return {
        valid: false,
        error: 'Missing Authorization header'
      }
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        valid: false,
        error: 'Invalid Authorization header format'
      }
    }

    const token = parts[1]

    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const verified = await jwtVerify(token, secret)

    const admin = verified.payload as unknown as AdminToken

    // Validate admin fields
    if (!admin.sub || !admin.email || !admin.role) {
      return {
        valid: false,
        error: 'Invalid token payload'
      }
    }

    // Check role is admin
    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      return {
        valid: false,
        error: 'User does not have admin role'
      }
    }

    console.log('[v0] Admin authenticated:', admin.email, 'Role:', admin.role)

    return {
      valid: true,
      admin
    }
  } catch (error) {
    console.error('[v0] Token verification failed:', error instanceof Error ? error.message : String(error))
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    }
  }
}

/**
 * Middleware to check admin auth on API routes
 * Usage: await requireAdminAuth(request)
 */
export async function requireAdminAuth(request: NextRequest) {
  const result = await verifyAdminToken(request)

  if (!result.valid) {
    console.log('[v0] Admin auth failed:', result.error)
    return NextResponse.json(
      { error: 'Unauthorized: ' + result.error },
      { status: 401 }
    )
  }

  return null // Return null if auth successful
}

/**
 * Middleware to check admin auth and return admin data
 */
export async function getAdminFromToken(request: NextRequest): Promise<AdminToken | null> {
  const result = await verifyAdminToken(request)
  return result.valid && result.admin ? result.admin : null
}
