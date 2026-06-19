import { NextResponse } from 'next/server'
import { errorHandler } from './error-handler'

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'

export interface ApiErrorResponse {
  success: false
  error: string
  code: ApiErrorCode
  details?: Record<string, any>
  requestId?: string
}

/**
 * Create standardized API error response
 */
export function createApiError(
  message: string,
  code: ApiErrorCode,
  statusCode: number,
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  const requestId = `req-${Date.now()}`

  // Log the error
  errorHandler.log(`API Error: ${message}`, statusCode >= 500 ? 'critical' : 'error', {
    code,
    statusCode,
    details,
    requestId,
  })

  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
      requestId,
    },
    { status: statusCode }
  )
}

/**
 * Wrap API handler with error boundary
 */
export function withErrorBoundary<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[v0] Error in ${context}:`, error)

      errorHandler.handleUncaughtError(
        error instanceof Error ? error : new Error(message),
        { context }
      )

      return createApiError(
        'Internal server error',
        'SERVER_ERROR',
        500,
        { context }
      )
    }
  }) as T
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  body: Record<string, any>,
  fields: string[]
): { valid: true } | { valid: false; error: NextResponse } {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null)

  if (missing.length > 0) {
    return {
      valid: false,
      error: createApiError(
        `Missing required fields: ${missing.join(', ')}`,
        'INVALID_INPUT',
        400,
        { missing }
      ),
    }
  }

  return { valid: true }
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(key: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const existing = rateLimitMap.get(key)

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (existing.count < limit) {
    existing.count++
    return true
  }

  return false
}
