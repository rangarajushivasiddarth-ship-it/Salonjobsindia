'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AdminStats, Subscription, User, Job, AppSettings } from './types'

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
}

const defaultStats: AdminStats = {
  totalUsers: 1247,
  activeSubscriptions: 342,
  totalJobs: 89,
  pendingApprovals: 12,
}

const defaultSettings: AppSettings = {
  qrCodeUrl: '/qr-code.png',
  radiusKm: 20,
  paymentInstructions: 'Scan the QR code and complete payment. Upload screenshot for verification.',
  subscriptionDurationDays: 30,
}

// Mock data
const mockPendingPayments: Subscription[] = [
  { id: 'p1', userId: 'u1', screenshotUrl: '/mock-screenshot-1.jpg', status: 'pending', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'p2', userId: 'u2', screenshotUrl: '/mock-screenshot-2.jpg', status: 'pending', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 'p3', userId: 'u3', screenshotUrl: '/mock-screenshot-3.jpg', status: 'pending', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
]

const mockUsers: User[] = [
  { id: 'u1', email: 'priya@example.com', phone: '9876543210', role: 'job_seeker', isSubscribed: true, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  { id: 'u2', email: 'rahul@example.com', phone: '9876543211', role: 'job_seeker', isSubscribed: false, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
  { id: 'u3', email: 'glamour@salon.com', phone: '9876543212', role: 'salon_owner', isSubscribed: true, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
  { id: 'u4', email: 'style@haven.com', phone: '9876543213', role: 'salon_owner', isSubscribed: true, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
  { id: 'u5', email: 'anita@example.com', phone: '9876543214', role: 'job_seeker', isSubscribed: false, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
]

const mockJobs: Job[] = [
  { id: 'j1', salonId: 's1', salonName: 'Glamour Studio', role: 'Hair Stylist', salary: '₹25,000 - ₹35,000', experience: '2-5 years', location: { lat: 19.076, lng: 72.877, address: 'Bandra West', area: 'Bandra' }, contact: '+91 98765 43210', createdAt: new Date(), isActive: true },
  { id: 'j2', salonId: 's2', salonName: 'Style Haven', role: 'Makeup Artist', salary: '₹20,000 - ₹30,000', experience: '1-3 years', location: { lat: 19.089, lng: 72.865, address: 'Andheri West', area: 'Andheri' }, contact: '+91 98765 43211', createdAt: new Date(), isActive: true },
  { id: 'j3', salonId: 's3', salonName: 'Beauty Bliss', role: 'Nail Technician', salary: '₹15,000 - ₹22,000', experience: 'Fresher', location: { lat: 19.054, lng: 72.840, address: 'Juhu', area: 'Juhu' }, contact: '+91 98765 43212', createdAt: new Date(), isActive: false },
]

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    currentView: 'login',
    stats: defaultStats,
    pendingPayments: mockPendingPayments,
    users: mockUsers,
    jobs: mockJobs,
    settings: defaultSettings,
  })

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

  const approvePayment = useCallback((subscriptionId: string) => {
    setState(prev => ({
      ...prev,
      pendingPayments: prev.pendingPayments.filter(p => p.id !== subscriptionId),
      stats: {
        ...prev.stats,
        activeSubscriptions: prev.stats.activeSubscriptions + 1,
        pendingApprovals: prev.stats.pendingApprovals - 1,
      },
    }))
  }, [])

  const rejectPayment = useCallback((subscriptionId: string) => {
    setState(prev => ({
      ...prev,
      pendingPayments: prev.pendingPayments.filter(p => p.id !== subscriptionId),
      stats: {
        ...prev.stats,
        pendingApprovals: prev.stats.pendingApprovals - 1,
      },
    }))
  }, [])

  const toggleUserBlock = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => 
        u.id === userId ? { ...u, isBlocked: !(u as any).isBlocked } : u
      ),
    }))
  }, [])

  const deleteJob = useCallback((jobId: string) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== jobId),
      stats: {
        ...prev.stats,
        totalJobs: prev.stats.totalJobs - 1,
      },
    }))
  }, [])

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
