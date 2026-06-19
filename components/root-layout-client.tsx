'use client'

import { ReactNode, useEffect } from 'react'
import { NotificationPermission } from './notification-permission'
import { SyncStatus } from './sync-status'
import { initializeBackgroundSync, setupOnlineListener } from '@/lib/background-sync'

interface RootLayoutClientProps {
  children: ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  useEffect(() => {
    // Initialize PWA background sync features
    initializeBackgroundSync()
    setupOnlineListener()

    console.log('[v0] PWA features initialized')
  }, [])

  return (
    <>
      {children}
      {/* PWA Features */}
      <NotificationPermission />
      <SyncStatus />
    </>
  )
}
