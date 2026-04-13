'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, Resume, Job, Subscription, UserRole } from './types'

interface AppState {
  user: User | null
  resume: Resume | null
  subscription: Subscription | null
  savedJobs: Job[]
  appliedJobs: string[]
  isAuthenticated: boolean
  currentStep: 'splash' | 'auth' | 'role' | 'resume' | 'discovery' | 'subscription' | 'results' | 'profile' | 'create-job' | 'owner-panel'
}

interface AppContextType extends AppState {
  login: (email: string, password: string, phone: string) => Promise<void>
  logout: () => void
  setRole: (role: UserRole) => void
  setResume: (resume: Resume) => void
  setSubscription: (subscription: Subscription) => void
  saveJob: (job: Job) => void
  unsaveJob: (jobId: string) => void
  applyToJob: (jobId: string) => void
  goToStep: (step: AppState['currentStep']) => void
  updateUser: (updates: Partial<User>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    resume: null,
    subscription: null,
    savedJobs: [],
    appliedJobs: [],
    isAuthenticated: false,
    currentStep: 'splash',
  })

  const login = useCallback(async (email: string, _password: string, phone: string) => {
    // Simulated API call - in production, this would call your backend
    const mockUser: User = {
      id: crypto.randomUUID(),
      email,
      phone,
      role: 'job_seeker',
      isSubscribed: false,
      createdAt: new Date(),
    }
    setState(prev => ({
      ...prev,
      user: mockUser,
      isAuthenticated: true,
      currentStep: 'role',
    }))
  }, [])

  const logout = useCallback(() => {
    setState({
      user: null,
      resume: null,
      subscription: null,
      savedJobs: [],
      appliedJobs: [],
      isAuthenticated: false,
      currentStep: 'splash',
    })
  }, [])

  const setRole = useCallback((role: UserRole) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, role } : null,
      currentStep: role === 'job_seeker' ? 'resume' : 'create-job',
    }))
  }, [])

  const setResume = useCallback((resume: Resume) => {
    setState(prev => ({
      ...prev,
      resume,
      currentStep: 'discovery',
    }))
  }, [])

  const setSubscription = useCallback((subscription: Subscription) => {
    const isApproved = subscription.status === 'approved'
    setState(prev => ({
      ...prev,
      subscription,
      user: prev.user ? { 
        ...prev.user, 
        isSubscribed: isApproved,
        subscriptionExpiry: subscription.expiresAt 
      } : null,
      currentStep: isApproved ? 'results' : prev.currentStep,
    }))
  }, [])

  const saveJob = useCallback((job: Job) => {
    setState(prev => ({
      ...prev,
      savedJobs: [...prev.savedJobs.filter(j => j.id !== job.id), job],
    }))
  }, [])

  const unsaveJob = useCallback((jobId: string) => {
    setState(prev => ({
      ...prev,
      savedJobs: prev.savedJobs.filter(j => j.id !== jobId),
    }))
  }, [])

  const applyToJob = useCallback((jobId: string) => {
    setState(prev => ({
      ...prev,
      appliedJobs: [...new Set([...prev.appliedJobs, jobId])],
    }))
  }, [])

  const goToStep = useCallback((step: AppState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        setRole,
        setResume,
        setSubscription,
        saveJob,
        unsaveJob,
        applyToJob,
        goToStep,
        updateUser,
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
