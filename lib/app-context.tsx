'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Resume, Job, Subscription, UserRole } from './types'

// Check if API is available (backend is running)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const isApiAvailable = () => !!API_BASE_URL

interface AppState {
  user: User | null
  resume: Resume | null
  subscription: Subscription | null
  savedJobs: Job[]
  appliedJobs: string[]
  isAuthenticated: boolean
  isLoading: boolean
  currentStep: 'splash' | 'auth' | 'role' | 'resume' | 'discovery' | 'subscription' | 'results' | 'profile' | 'create-job' | 'owner-panel'
}

interface AppContextType extends AppState {
  signIn: (email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  signUp: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setRole: (role: UserRole) => void
  setResume: (resume: Resume) => void
  setSubscription: (subscription: Subscription) => void
  saveJob: (job: Job) => void
  unsaveJob: (jobId: string) => void
  applyToJob: (jobId: string) => void
  goToStep: (step: AppState['currentStep']) => void
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Storage keys
const TOKEN_KEY = 'fitonze_token'
const USER_KEY = 'fitonze_user'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    resume: null,
    subscription: null,
    savedJobs: [],
    appliedJobs: [],
    isAuthenticated: false,
    isLoading: true,
    currentStep: 'splash',
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem(USER_KEY)
        
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser) as User
            setState(prev => ({
              ...prev,
              user,
              isAuthenticated: true,
              isLoading: false,
              currentStep: user.role ? 
                (user.role === 'job_seeker' ? 'discovery' : 'owner-panel') 
                : 'role',
            }))
            return
          } catch {
            // Invalid saved user, clear storage
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
    }
    
    // Small delay for splash screen
    setTimeout(checkAuth, 1500)
  }, [])

  const signIn = useCallback(async (email: string, password: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if user exists in localStorage (registered users)
      const registeredUsersStr = localStorage.getItem('fitonze_registered_users')
      const registeredUsers: Record<string, { email: string; password: string; phone: string; user: User }> = 
        registeredUsersStr ? JSON.parse(registeredUsersStr) : {}
      
      const userRecord = registeredUsers[email.toLowerCase()]
      
      if (!userRecord) {
        return { success: false, error: 'No account found with this email. Please sign up first.' }
      }
      
      if (userRecord.password !== password) {
        return { success: false, error: 'Invalid password. Please try again.' }
      }
      
      // Verify phone number matches
      const registeredPhone = userRecord.user.phone?.replace(/\D/g, '')
      const inputPhone = phone.replace(/\D/g, '')
      if (registeredPhone && registeredPhone !== inputPhone) {
        return { success: false, error: 'Phone number does not match. Please check and try again.' }
      }
      
      const user = userRecord.user
      
      // Save to storage
      localStorage.setItem(TOKEN_KEY, 'mock-token-' + Date.now())
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        currentStep: user.role ? 
          (user.role === 'job_seeker' ? 'discovery' : 'owner-panel') 
          : 'role',
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'Failed to sign in. Please try again.' }
    }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if email already exists
      const registeredUsersStr = localStorage.getItem('fitonze_registered_users')
      const registeredUsers: Record<string, { email: string; password: string; user: User }> = 
        registeredUsersStr ? JSON.parse(registeredUsersStr) : {}
      
      if (registeredUsers[email.toLowerCase()]) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' }
      }
      
      // Create new user
      const user: User = {
        id: crypto.randomUUID(),
        email,
        phone,
        name,
        role: undefined as unknown as UserRole, // Will be set in role selection
        isSubscribed: false,
        createdAt: new Date(),
      }
      
      // Save to registered users
      registeredUsers[email.toLowerCase()] = { email, password, user }
      localStorage.setItem('fitonze_registered_users', JSON.stringify(registeredUsers))
      
      // Save current session
      localStorage.setItem(TOKEN_KEY, 'mock-token-' + Date.now())
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        currentStep: 'role',
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'Failed to create account. Please try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    
    setState({
      user: null,
      resume: null,
      subscription: null,
      savedJobs: [],
      appliedJobs: [],
      isAuthenticated: false,
      isLoading: false,
      currentStep: 'splash',
    })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem(USER_KEY)
      if (savedUser) {
        const user = JSON.parse(savedUser) as User
        setState(prev => ({
          ...prev,
          user,
        }))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  const setRole = useCallback((role: UserRole) => {
    setState(prev => {
      if (!prev.user) return prev
      
      const updatedUser = { ...prev.user, role }
      
      // Update in registered users storage
      const registeredUsersStr = localStorage.getItem('fitonze_registered_users')
      if (registeredUsersStr && prev.user.email) {
        const registeredUsers = JSON.parse(registeredUsersStr)
        const emailKey = prev.user.email.toLowerCase()
        if (registeredUsers[emailKey]) {
          registeredUsers[emailKey].user = updatedUser
          localStorage.setItem('fitonze_registered_users', JSON.stringify(registeredUsers))
        }
      }
      
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
      
      return {
        ...prev,
        user: updatedUser,
        currentStep: role === 'job_seeker' ? 'resume' : 'create-job',
      }
    })
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
