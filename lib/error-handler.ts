'use client'

/**
 * Production error handler and logging utility
 * Provides consistent error tracking without impacting PWA/TWA
 */

export type ErrorLevel = 'info' | 'warn' | 'error' | 'critical'

export interface ErrorLog {
  timestamp: string
  level: ErrorLevel
  message: string
  code?: string
  context?: Record<string, any>
  stack?: string
  url?: string
  userId?: string
}

class ErrorHandler {
  private logs: ErrorLog[] = []
  private maxLogs = 100
  private isDev = process.env.NODE_ENV === 'development'

  /**
   * Log an error with context
   */
  log(message: string, level: ErrorLevel = 'error', context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    // Add to in-memory log
    this.logs.push(errorLog)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output in development
    if (this.isDev) {
      if (level === 'critical') {
        console.error(`[v0] [${level.toUpperCase()}] ${message}`, context)
      } else if (level === 'warn') {
        console.warn(`[v0] [${level.toUpperCase()}] ${message}`, context)
      } else {
        console.log(`[v0] [${level.toUpperCase()}] ${message}`, context)
      }
    }

    // Send to monitoring service in production (only for critical errors)
    if (!this.isDev && level === 'critical') {
      this.sendToMonitoring(errorLog)
    }

    return errorLog
  }

  /**
   * Log user actions for debugging
   */
  logAction(action: string, details?: Record<string, any>) {
    return this.log(`Action: ${action}`, 'info', details)
  }

  /**
   * Log API calls
   */
  logApiCall(endpoint: string, method: string, status: number, duration: number) {
    return this.log(`API ${method} ${endpoint}`, status >= 400 ? 'warn' : 'info', {
      status,
      duration: `${duration}ms`,
    })
  }

  /**
   * Handle uncaught errors
   */
  handleUncaughtError(error: Error, context?: Record<string, any>) {
    const errorLog = this.log(error.message, 'critical', {
      ...context,
      stack: error.stack,
    })

    // Show user-friendly message (doesn't crash the app)
    if (typeof window !== 'undefined') {
      console.error('[v0] Uncaught error:', error)
    }

    return errorLog
  }

  /**
   * Get recent logs
   */
  getLogs(limit = 50): ErrorLog[] {
    return this.logs.slice(-limit)
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Send critical errors to monitoring service
   */
  private async sendToMonitoring(errorLog: ErrorLog) {
    try {
      // Only send if we have a monitoring endpoint
      const monitoringUrl = process.env.NEXT_PUBLIC_ERROR_MONITORING_URL
      if (!monitoringUrl) return

      await fetch(monitoringUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      })
    } catch (err) {
      // Silently fail - don't crash on monitoring errors
      console.warn('[v0] Failed to send error to monitoring:', err)
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler()

/**
 * Setup global error handlers (only in browser)
 */
export function setupErrorHandlers() {
  if (typeof window === 'undefined') return

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorHandler.handleUncaughtError(event.error, {
      type: 'uncaughtError',
    })
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.log(
      `Unhandled Promise Rejection: ${event.reason}`,
      'critical',
      {
        type: 'unhandledRejection',
        reason: event.reason,
      }
    )
  })

  console.log('[v0] Global error handlers initialized')
}
