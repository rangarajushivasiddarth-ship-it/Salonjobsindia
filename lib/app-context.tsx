'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Resume, Subscription, UserRole } from './types'
import { UserService, JobSeekerService, SubscriptionService, NotificationService, SyncService } from './data-service'

interface AppState {
  user: User | null
  resume: Resume | null
  subscription: Subscription | null
  savedJobs: string[]
  appliedJobs: string[]
  isAuthenticated: boolean
  isLoading: boolean
  unreadNotifications: number
  currentStep: 'splash' | 'auth' | 'role' | 'resume' | 'discovery' | 'subscription' | 'results' | 'profile' | 'create-job' | 'owner-panel' | 'messages' | 'notifications' | 'settings' | 'training'
}

interface AppContextType extends AppState {
  signIn: (email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  signUp: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setRole: (role: UserRole) => void
  setResume: (resume: Resume) => void
  setSubscription: (subscription: Subscription) => void
  saveJob: (jobId: string) => void
  unsaveJob: (jobId: string) => void
  applyToJob: (jobId: string) => void
  goToStep: (step: AppState['currentStep']) => void
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
  refreshNotifications: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Storage keys for session data
const SAVED_JOBS_KEY = 'fitone_saved_jobs'
const APPLIED_JOBS_KEY = 'fitone_applied_jobs'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    resume: null,
    subscription: null,
    savedJobs: [],
    appliedJobs: [],
    isAuthenticated: false,
    isLoading: true,
    unreadNotifications: 0,
    currentStep: 'splash',
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = UserService.getCurrentUser()
        
        if (currentUser) {
          // Load saved jobs and applied jobs
          const savedJobs = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]')
          const appliedJobs = JSON.parse(localStorage.getItem(APPLIED_JOBS_KEY) || '[]')
          
          // Get subscription status
          const subscription = SubscriptionService.getByUserId(currentUser.id)
          
          // Get unread notifications count
          const unreadCount = NotificationService.getUnreadCount(currentUser.id)
          
          setState(prev => ({
            ...prev,
            user: currentUser as unknown as User,
            savedJobs,
            appliedJobs,
            subscription: subscription as unknown as Subscription,
            unreadNotifications: unreadCount,
            isAuthenticated: true,
            isLoading: false,
            currentStep: currentUser.role ? 
              (currentUser.role === 'job_seeker' ? 
                (currentUser.isSubscribed ? 'results' : 'discovery') 
                : 'owner-panel') // handles both 'salon_owner' and 'employer'
              : 'role',
          }))
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
    }
    
    // Small delay for splash screen
    setTimeout(checkAuth, 1500)
  }, [])

  // Subscribe to real-time data updates
  useEffect(() => {
    if (!state.user?.id) return
    
    const unsubscribe = SyncService.subscribe('*', () => {
      // Refresh notification count on any data change
      const unreadCount = NotificationService.getUnreadCount(state.user!.id)
      setState(prev => ({ ...prev, unreadNotifications: unreadCount }))
    })
    
    return unsubscribe
  }, [state.user?.id])
  
  // Poll for subscription approval with cross-tab sync
  useEffect(() => {
    if (!state.user?.id || state.user.isSubscribed) return
    
    const checkApproval = () => {
      // Check from data-store
      const dataStoreKey = 'fitone_subscriptions'
      try {
        const stored = localStorage.getItem(dataStoreKey)
        if (stored) {
          const subs = JSON.parse(stored)
          const userSub = subs.find((s: { userId: string; status: string }) => 
            s.userId === state.user?.id && s.status === 'approved'
          )
          if (userSub) {
            // Subscription approved! Update state
            setState(prev => ({
              ...prev,
              user: prev.user ? { ...prev.user, isSubscribed: true } : prev.user,
              subscription: userSub as Subscription,
              currentStep: (prev.user?.role === 'salon_owner' || prev.user?.role === 'employer') ? 'owner-panel' : 'results',
            }))
          }
        }
      } catch {
        // Ignore errors
      }
    }
    
    // Check immediately and poll every 3 seconds
    checkApproval()
    const interval = setInterval(checkApproval, 3000)
    
    // Listen for storage changes from admin tab
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'fitone_subscriptions' || event.key === 'fitone_sync_trigger') {
        checkApproval()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [state.user?.id, state.user?.isSubscribed])

  const signIn = useCallback(async (email: string, password: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    const result = await UserService.login({ email, password, phone })
    
    if (result.success && result.user) {
      const user = result.user as unknown as User
      
      // Load user data
      const savedJobs = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]')
      const appliedJobs = JSON.parse(localStorage.getItem(APPLIED_JOBS_KEY) || '[]')
      const subscription = SubscriptionService.getByUserId(user.id)
      const unreadCount = NotificationService.getUnreadCount(user.id)
      
      setState(prev => ({
        ...prev,
        user,
        savedJobs,
        appliedJobs,
        subscription: subscription as unknown as Subscription,
        unreadNotifications: unreadCount,
        isAuthenticated: true,
        currentStep: user.role ? 
          (user.role === 'job_seeker' ? 
            (user.isSubscribed ? 'results' : 'discovery') 
            : 'owner-panel') 
          : 'role',
      }))
      
      return { success: true }
    }
    
    return { success: false, error: result.error }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    const result = await UserService.register({ name, email, password, phone })
    
    if (result.success && result.user) {
      const user = result.user as unknown as User
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        currentStep: 'role',
      }))
      
      return { success: true }
    }
    
    return { success: false, error: result.error }
  }, [])

  const logout = useCallback(() => {
    UserService.logout()
    
    setState({
      user: null,
      resume: null,
      subscription: null,
      savedJobs: [],
      appliedJobs: [],
      isAuthenticated: false,
      isLoading: false,
      unreadNotifications: 0,
      currentStep: 'splash',
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = UserService.getCurrentUser()
    if (currentUser) {
      setState(prev => ({
        ...prev,
        user: currentUser as unknown as User,
      }))
    }
  }, [])

  const refreshNotifications = useCallback(() => {
    if (state.user?.id) {
      const unreadCount = NotificationService.getUnreadCount(state.user.id)
      setState(prev => ({ ...prev, unreadNotifications: unreadCount }))
    }
  }, [state.user?.id])

  const setRole = useCallback(async (role: UserRole) => {
    if (!state.user) return
    
    const updatedUser = await UserService.updateUser(state.user.id, { role })
    
    if (updatedUser) {
      setState(prev => ({
        ...prev,
        user: updatedUser as unknown as User,
        currentStep: role === 'job_seeker' ? 'resume' : 'create-job',
      }))
    }
  }, [state.user])

  const setResume = useCallback(async (resume: Resume) => {
    if (!state.user) return
    
    // Save job seeker profile
    await JobSeekerService.create({
      userId: state.user.id,
      name: resume.name,
      role: resume.role,
      dateOfBirth: '',
      experience: resume.experience,
      skills: resume.skills,
      salaryExpectation: resume.salaryExpectation,
      location: resume.location,
      identityProof: {
        type: '',
        verified: false,
      },
    })
    
    setState(prev => ({
      ...prev,
      resume,
      currentStep: 'discovery',
    }))
  }, [state.user])

  const setSubscription = useCallback(async (subscription: Subscription) => {
    const isApproved = subscription.status === 'approved'
    
    if (state.user && isApproved) {
      await UserService.updateUser(state.user.id, {
        isSubscribed: true,
        subscriptionPlan: subscription.planName || subscription.planType,
        subscriptionExpiry: subscription.expiresAt?.toString(),
      })
    }
    
    setState(prev => ({
      ...prev,
      subscription,
      user: prev.user ? { 
        ...prev.user, 
        isSubscribed: isApproved,
        subscriptionExpiry: isApproved ? subscription.expiresAt : undefined
      } : null,
      currentStep: isApproved ? 'results' : prev.currentStep,
    }))
  }, [state.user])

  const saveJob = useCallback((jobId: string) => {
    setState(prev => {
      const newSavedJobs = [...new Set([...prev.savedJobs, jobId])]
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(newSavedJobs))
      return { ...prev, savedJobs: newSavedJobs }
    })
  }, [])

  const unsaveJob = useCallback((jobId: string) => {
    setState(prev => {
      const newSavedJobs = prev.savedJobs.filter(id => id !== jobId)
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(newSavedJobs))
      return { ...prev, savedJobs: newSavedJobs }
    })
  }, [])

  const applyToJob = useCallback((jobId: string) => {
    setState(prev => {
      const newAppliedJobs = [...new Set([...prev.appliedJobs, jobId])]
      localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(newAppliedJobs))
      return { ...prev, appliedJobs: newAppliedJobs }
    })
  }, [])

  const goToStep = useCallback((step: AppState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return
    
    const updatedUser = await UserService.updateUser(state.user.id, updates as Parameters<typeof UserService.updateUser>[1])
    
    if (updatedUser) {
      setState(prev => ({
        ...prev,
        user: updatedUser as unknown as User,
      }))
    }
  }, [state.user])

  return (
    <AppContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        logout,
        setRole,
        setResume,
        setSubscription,
        saveJob,
        unsaveJob,
        applyToJob,
        goToStep,
        updateUser,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
