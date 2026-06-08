'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6 space-y-2">
          <h1 className="text-4xl font-bold text-foreground">403</h1>
          <h2 className="text-2xl font-semibold text-foreground">Access Denied</h2>
        </div>
        
        <p className="mb-8 text-muted-foreground">
          You do not have permission to access this page. This could be due to an invalid role or insufficient privileges.
        </p>

        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            If you believe this is an error, please contact support with your user ID.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-secondary px-6 py-2 font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            Go Back
          </button>
          <Link
            href="/"
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>Error Code: UNAUTHORIZED_ROLE</p>
        </div>
      </div>
    </main>
  )
}
