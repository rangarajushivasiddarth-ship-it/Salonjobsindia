'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminProvider, useAdmin } from '@/lib/admin-context'
import { LanguageProvider } from '@/lib/language-context'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPayments } from '@/components/admin/admin-payments'
import { AdminUsers } from '@/components/admin/admin-users'
import { AdminJobs } from '@/components/admin/admin-jobs'
import { AdminSettings } from '@/components/admin/admin-settings'
import { shouldShowAdminUI } from '@/lib/platform-utils'

function AdminApp() {
  const { isAuthenticated, currentView } = useAdmin()

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  switch (currentView) {
    case 'dashboard':
      return <AdminDashboard />
    case 'payments':
      return <AdminPayments />
    case 'users':
      return <AdminUsers />
    case 'jobs':
      return <AdminJobs />
    case 'settings':
      return <AdminSettings />
    default:
      return <AdminDashboard />
  }
}

function AdminPageContent() {
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if running on web platform (not mobile/PWA)
    if (!shouldShowAdminUI()) {
      console.log('[v0] Admin access blocked: Not on web platform')
      router.push('/')
      return
    }
    setIsAllowed(true)
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Admin access only available on web platform</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminApp />
    </main>
  )
}

export default function AdminPage() {
  return (
    <LanguageProvider>
      <AdminProvider>
        <AdminPageContent />
      </AdminProvider>
    </LanguageProvider>
  )
}

