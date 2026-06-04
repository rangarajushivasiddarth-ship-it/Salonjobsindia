import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|css|js|json)$/)
  ) {
    return NextResponse.next()
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
