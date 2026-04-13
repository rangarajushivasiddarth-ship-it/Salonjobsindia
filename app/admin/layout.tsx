import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'SalonJobs Admin - Dashboard',
  description: 'Admin dashboard for managing SalonJobs marketplace',
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
  width: 'device-width',
  initialScale: 1,
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
