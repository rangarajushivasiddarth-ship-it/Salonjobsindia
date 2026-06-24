'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AdminStats, AppSettings, User, Job, Subscription } from './types'
import { 
  UserService, 
  JobService, 
  SubscriptionService, 
  AdminService, 
  SyncService,
  NotificationService 
} from './data-service'
import { JOB_SEEKER_PLANS, approveSubscription as approveSubscriptionInStore, rejectSubscription as rejectSubscriptionInStore, getAllSubscriptions } from './data-store'

interface AdminState {
  isAuthenticated: boolean
  currentView: 'login' | 'dashboard' | 'payments' | 'users' | 'jobs' | 'settings'
  stats: AdminStats
  pendingPayments: Subscription[]
  users: User[]
  jobs: Job[]
  settings: AppSettings
  lastSyncTime: Date | null
}

interface AdminContextType extends AdminState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  goToView: (view: AdminState['currentView']) => void
  approvePayment: (subscriptionId: string) => void
  rejectPayment: (subscriptionId: string, reason?: string) => void
  approveJob: (jobId: string) => void
  rejectJob: (jobId: string, reason: string) => void
  toggleUserBlock: (userId: string) => void
  deleteJob: (jobId: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  refreshData: () => void
}

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalJobSeekers: 0,
  totalSalonOwners: 0,
  totalJobs: 0,
  activeJobs: 0,
  totalApplications: 0,
  pendingPayments: 0,
  pendingApprovals: 0,
  activeSubscriptions: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
}

const defaultSettings: AppSettings = {
  qrCodeUrl: '/images/payment-qr.jpg',
  upiId: '9100609609@upi',
  radiusKm: 20,
  paymentInstructions: 'Scan the QR code and complete payment. Upload screenshot for verification.',
  subscriptionDurationDays: 30,
  supportEmail: 'support@salonjobsindia.com',
  supportPhone: '+91 9100609609',
  appVersion: '1.0.0',
}

const ADMIN_SESSION_KEY = 'salonjobsindia_admin_session'

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    currentView: 'login',
    stats: defaultStats,
    pendingPayments: [],
    users: [],
    jobs: [],
    settings: defaultSettings,
    lastSyncTime: null,
  })

  // Load data from shared data service
  const loadData = useCallback(() => {
    // Get from data-service
    const dashboardStats = AdminService.getDashboardStats()
    const pendingPaymentsFromService = SubscriptionService.getPending()
    const usersFromService = UserService.getAll()
    const pendingJobs = JobService.getPendingApproval()
    const allJobs = JobService.getLiveJobs()
    
    // Also get from data-store for customer app subscriptions
    const allFromDataStore = getAllSubscriptions()
    const pendingFromDataStore = allFromDataStore.filter(s => s.status === 'pending')
    
    
    
    // Merge pending subscriptions (use data-store as primary since that's what customer app uses)
    const mergedPending = pendingFromDataStore.length > 0 
      ? pendingFromDataStore 
      : pendingPaymentsFromService
    
    setState(prev => ({
      ...prev,
      pendingPayments: mergedPending as unknown as Subscription[],
      jobs: [...pendingJobs, ...allJobs] as unknown as Job[],
      users: usersFromService as unknown as User[],
      stats: {
        ...prev.stats,
        totalUsers: dashboardStats.totalUsers,
        totalJobSeekers: dashboardStats.jobSeekers || 0,
        totalSalonOwners: dashboardStats.salonOwners || 0,
        activeSubscriptions: dashboardStats.activeSubscriptions,
        totalJobs: dashboardStats.totalJobs,
        activeJobs: dashboardStats.liveJobs || 0,
        pendingApprovals: mergedPending.length + (dashboardStats.pendingJobApprovals || 0),
        pendingSubscriptions: mergedPending.length,
      },
      lastSyncTime: new Date(),
    }))
  }, [])

  // Check for existing admin session
  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY)
    if (session) {
      try {
        const { isAuthenticated, expiresAt } = JSON.parse(session)
        if (isAuthenticated && new Date(expiresAt) > new Date()) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            currentView: 'dashboard',
          }))
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY)
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY)
      }
    }
  }, [])

  // Real-time data sync with cross-tab support
  useEffect(() => {
    if (state.isAuthenticated) {
      // Initial load
      loadData()
      
      // Poll for updates every 2 seconds for real-time feel
      const interval = setInterval(loadData, 2000)
      
      // Listen for storage changes from other tabs (customer app)
      const handleStorageChange = (event: StorageEvent) => {
if (event.key === 'salonjobsindia_subscriptions' ||
        event.key === 'salonjobsindia_users' ||
        event.key === 'salonjobsindia_jobs' ||
        event.key === 'salonjobsindia_sync_trigger') {
          // Immediately reload data when customer app makes changes
          
          loadData()
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      // Subscribe to data changes within same tab
      const unsubscribe = SyncService.subscribe('*', () => {
        loadData()
      })
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('storage', handleStorageChange)
        unsubscribe()
      }
    }
  }, [state.isAuthenticated, loadData])

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('[v0] Admin login attempt:', email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      console.log('[v0] Login response status:', response.status, 'data:', data)

      if (!response.ok || !data.success) {
        console.error('[v0] Login failed:', data.error)
        return false
      }

      // Check if user has admin role
      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        console.error('[v0] User does not have admin privileges:', data.user.role)
        return false
      }

      // Store session
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        isAuthenticated: true,
        user: data.user,
        expiresAt: expiresAt.toISOString()
      }))

      console.log('[v0] Admin logged in successfully:', data.user.email)

      // Update state
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentView: 'dashboard',
      }))

      // Load admin data
      loadData()

      return true
    } catch (error) {
      console.error('[v0] Login error:', error)
      return false
    }
  }, [loadData])

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      currentView: 'login',
    }))
  }, [])

  const goToView = useCallback((view: AdminState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }))
  }, [])

  const refreshData = useCallback(() => {
    loadData()
  }, [loadData])

  const approvePayment = useCallback(async (subscriptionId: string) => {
    const subscription = state.pendingPayments.find(p => p.id === subscriptionId)
    
    if (subscription) {
      // Approve in data-store (this updates customer app)
      approveSubscriptionInStore(subscriptionId)
      
      // Also try to approve in data-service
      try {
        await AdminService.approveSubscription(subscriptionId, 'admin')
      } catch {
        // May not exist in data-service, that's ok
      }
      
      // Get user phone from subscription or user service
      const userPhone = (subscription as any).userPhone || UserService.getById(subscription.userId)?.phone
      const planName = (subscription as any).planName || 'Premium'
      
      // Send WhatsApp notification
      if (userPhone) {
        const phone = userPhone.replace(/\D/g, '')
        const message = encodeURIComponent(
          `🎉 Congratulations! Your FITONZE ${planName} subscription has been activated!\n\n✅ You now have full access to premium features.\n\nThank you for subscribing!\n\n- Team FITONZE`
        )
        window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
      }
      
      // Refresh data
      loadData()
    }
  }, [state.pendingPayments, loadData])

  const rejectPayment = useCallback(async (subscriptionId: string, reason?: string) => {
    // Reject in data-store (this updates customer app)
    rejectSubscriptionInStore(subscriptionId, reason)
    
    // Also try to reject in data-service
    try {
      await AdminService.rejectSubscription(subscriptionId, 'admin', reason || 'Payment verification failed')
    } catch {
      // May not exist in data-service, that's ok
    }
    
    loadData()
  }, [loadData])

  const approveJob = useCallback(async (jobId: string) => {
    await AdminService.approveJob(jobId, 'admin')
    loadData()
  }, [loadData])

  const rejectJob = useCallback(async (jobId: string, reason: string) => {
    await AdminService.rejectJob(jobId, 'admin', reason)
    loadData()
  }, [loadData])

  const toggleUserBlock = useCallback(async (userId: string) => {
    const user = state.users.find(u => u.id === userId)
    if (user) {
      await UserService.updateUser(userId, { 
        isBlocked: !(user as any).isBlocked 
      } as any)
      loadData()
    }
  }, [state.users, loadData])

  const deleteJob = useCallback(async (jobId: string) => {
    await JobService.update(jobId, { isActive: false, status: 'rejected' } as any)
    loadData()
  }, [loadData])

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }))
    // Save settings to localStorage
    localStorage.setItem('salonjobsindia_admin_settings', JSON.stringify({ ...state.settings, ...newSettings }))
  }, [state.settings])

  return (
    <AdminContext.Provider
      value={{
        ...state,
        login,
        logout,
        goToView,
        approvePayment,
        rejectPayment,
        approveJob,
        rejectJob,
        toggleUserBlock,
        deleteJob,
        updateSettings,
        refreshData,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
