'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NoProfilePage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6 space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Profile Not Found</h1>
          <h2 className="text-lg text-muted-foreground">Setup Required</h2>
        </div>
        
        <p className="mb-8 text-muted-foreground">
          Your account exists, but you haven&apos;t completed your profile yet. Please complete your profile to continue using the platform.
        </p>

        <div className="mb-6 rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm text-warning">
            Complete your profile to unlock all features and start applying or posting jobs.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/profile/setup"
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Complete Profile
          </Link>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-secondary px-6 py-2 font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>Error Code: NO_PROFILE</p>
        </div>
      </div>
    </main>
  )
}
