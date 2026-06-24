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
  const loadData = useCallback(async () => {
    try {
      console.log('[v0] Loading admin data from Supabase...')
      
      // Get from data-service
      const dashboardStats = AdminService.getDashboardStats()
      const pendingPaymentsFromService = SubscriptionService.getPending()
      const usersFromService = UserService.getAll()
      const pendingJobs = JobService.getPendingApproval()
      const allJobs = JobService.getLiveJobs()
      
      // Fetch pending payments from Supabase payments table
      let supabasePending: Subscription[] = []
      try {
        const response = await fetch('/api/payments?status=pending', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const paymentData = await response.json()
          console.log('[v0] Fetched payments from API:', paymentData)
          
          // Convert Supabase payment records to Subscription format
          supabasePending = (paymentData.data || []).map((payment: any) => ({
            id: payment.id,
            userId: payment.user_id,
            amount: payment.amount,
            type: payment.type || 'contact_pack',
            status: payment.status,
            screenshotUrl: payment.screenshot_url,
            submittedAt: payment.submitted_at,
            credits: payment.contact_credits,
          }))
        }
      } catch (error) {
        console.error('[v0] Error fetching Supabase payments:', error)
      }
      
      console.log('[v0] Fetched pending payments from Supabase:', supabasePending.length)
      
      setState(prev => ({
        ...prev,
        pendingPayments: supabasePending as unknown as Subscription[],
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
          pendingApprovals: supabasePending.length + (dashboardStats.pendingJobApprovals || 0),
          pendingSubscriptions: supabasePending.length,
        },
        lastSyncTime: new Date(),
      }))
    } catch (error) {
      console.error('[v0] Error loading admin data:', error)
    }
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
    try {
      await AdminService.approveSubscription(subscriptionId, 'admin')
      
      // Refresh data after approval
      loadData()
    } catch (error) {
      console.error('[v0] Failed to approve payment:', error)
    }
  }, [loadData])

  const rejectPayment = useCallback(async (subscriptionId: string, reason?: string) => {
    try {
      await AdminService.rejectSubscription(subscriptionId, 'admin', reason || 'Payment verification failed')
      
      // Refresh data after rejection
      loadData()
    } catch (error) {
      console.error('[v0] Failed to reject payment:', error)
    }
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
