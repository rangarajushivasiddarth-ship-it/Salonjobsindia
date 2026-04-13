'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AdminStats, Subscription, User, Job, AppSettings } from './types'
import { 
  getPendingSubscriptions, 
  approveSubscription as approveSubInStore, 
  rejectSubscription as rejectSubInStore,
  getAllJobs,
  deleteJob as deleteJobInStore,
  getAllUsersForAdmin,
  JOB_SEEKER_PLANS
} from './data-store'

interface AdminState {
  isAuthenticated: boolean
  currentView: 'login' | 'dashboard' | 'payments' | 'users' | 'jobs' | 'settings'
  stats: AdminStats
  pendingPayments: Subscription[]
  users: User[]
  jobs: Job[]
  settings: AppSettings
}

interface AdminContextType extends AdminState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  goToView: (view: AdminState['currentView']) => void
  approvePayment: (subscriptionId: string) => void
  rejectPayment: (subscriptionId: string) => void
  toggleUserBlock: (userId: string) => void
  deleteJob: (jobId: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  refreshData: () => void
}

const defaultStats: AdminStats = {
  totalUsers: 0,
  activeSubscriptions: 0,
  totalJobs: 0,
  pendingApprovals: 0,
}

const defaultSettings: AppSettings = {
  qrCodeUrl: '/images/payment-qr.png',
  radiusKm: 20,
  paymentInstructions: 'Scan the QR code and complete payment. Upload screenshot for verification.',
  subscriptionDurationDays: 30,
}

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
  })

  // Load data from shared store
  const loadData = useCallback(() => {
    const pendingPayments = getPendingSubscriptions()
    const jobs = getAllJobs()
    const users = getAllUsersForAdmin()
    
    setState(prev => ({
      ...prev,
      pendingPayments,
      jobs,
      users,
      stats: {
        totalUsers: users.length,
        activeSubscriptions: users.filter(u => u.isSubscribed).length,
        totalJobs: jobs.length,
        pendingApprovals: pendingPayments.length,
      },
    }))
  }, [])

  // Initial data load and polling for real-time updates
  useEffect(() => {
    if (state.isAuthenticated) {
      loadData()
      
      // Poll for updates every 5 seconds
      const interval = setInterval(loadData, 5000)
      
      // Also listen for custom events
      const handleDataUpdate = () => loadData()
      window.addEventListener('fitonze_data_update', handleDataUpdate)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('fitonze_data_update', handleDataUpdate)
      }
    }
  }, [state.isAuthenticated, loadData])

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple validation (in production, this would be a real auth check)
    if (email === 'admin@fitonze.com' && password === 'admin123') {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentView: 'dashboard',
      }))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
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

  const approvePayment = useCallback((subscriptionId: string) => {
    // Find the subscription to get user phone
    const subscription = state.pendingPayments.find(p => p.id === subscriptionId)
    
    if (subscription) {
      // Approve in data store (this also updates the user's subscription status)
      const approved = approveSubInStore(subscriptionId)
      
      if (approved && subscription.userPhone) {
        // Send WhatsApp notification
        const phone = subscription.userPhone.replace(/\D/g, '')
        const planName = subscription.planType ? JOB_SEEKER_PLANS.find(p => p.id === subscription.planType)?.name : 'Premium'
        const message = encodeURIComponent(
          `Congratulations! Your Fitonze ${planName} subscription has been activated! You now have access to view salon details. Thank you for subscribing!`
        )
        // Open WhatsApp with pre-filled message
        window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
      }
      
      // Refresh data to update UI
      loadData()
    }
  }, [state.pendingPayments, loadData])

  const rejectPayment = useCallback((subscriptionId: string) => {
    rejectSubInStore(subscriptionId)
    loadData()
  }, [loadData])

  const toggleUserBlock = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => 
        u.id === userId ? { ...u, isBlocked: !(u as any).isBlocked } : u
      ),
    }))
  }, [])

  const deleteJob = useCallback((jobId: string) => {
    deleteJobInStore(jobId)
    loadData()
  }, [loadData])

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }))
  }, [])

  return (
    <AdminContext.Provider
      value={{
        ...state,
        login,
        logout,
        goToView,
        approvePayment,
        rejectPayment,
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
