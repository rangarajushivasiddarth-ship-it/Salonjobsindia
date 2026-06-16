import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes - redirect non-authenticated to home
  if (pathname.startsWith('/admin')) {
    const userId = request.cookies.get('userId')?.value
    const userRole = request.cookies.get('userRole')?.value

    // If not authenticated or not admin, redirect to home
    if (!userId || userRole !== 'admin') {
      console.log('[v0] Admin access denied:', { userId, userRole, path: pathname })
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
