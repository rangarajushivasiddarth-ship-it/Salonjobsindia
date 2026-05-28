'use client'

import { AdminProvider, useAdmin } from '@/lib/admin-context'
import { LanguageProvider } from '@/lib/language-context'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPayments } from '@/components/admin/admin-payments'
import { AdminUsers } from '@/components/admin/admin-users'
import { AdminJobs } from '@/components/admin/admin-jobs'
import { AdminSettings } from '@/components/admin/admin-settings'

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

export default function AdminPage() {
  return (
    <LanguageProvider>
      <AdminProvider>
        <main className="min-h-screen bg-background">
          <AdminApp />
        </main>
      </AdminProvider>
    </LanguageProvider>
  )
}
