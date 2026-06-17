import { NextRequest, NextResponse } from 'next/server'

// Export as 'proxy' for Next.js 16+ (renamed from middleware)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip proxy for static files and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|css|js|json)$/)
  ) {
    return NextResponse.next()
  }

  // Protect admin routes - redirect non-authenticated or mobile users to home
  if (pathname.startsWith('/admin')) {
    const userId = request.cookies.get('userId')?.value
    const userRole = request.cookies.get('userRole')?.value
    const userAgent = request.headers.get('user-agent') || ''

    // Check if running on mobile/PWA (user-agent patterns)
    const isMobileOrPWA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|PWA/i.test(userAgent)

    // If not authenticated, not admin, or on mobile/PWA, redirect to home
    if (!userId || userRole !== 'admin' || isMobileOrPWA) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Remove trailing slash from API routes to prevent 308 redirects
  if (pathname.startsWith('/api/') && pathname.endsWith('/') && pathname !== '/api/') {
    const newPathname = pathname.slice(0, -1)
    request.nextUrl.pathname = newPathname
    return NextResponse.redirect(request.nextUrl, { status: 307 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
