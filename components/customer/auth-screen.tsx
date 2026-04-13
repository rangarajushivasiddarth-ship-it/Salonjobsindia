'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

type AuthMode = 'signin' | 'signup'

interface AuthScreenProps {
  onSignIn: (email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  onSignUp: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>
  onBack: () => void
}

export function AuthScreen({ onSignIn, onSignUp, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const validateSignInForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSignUpForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!name) {
      newErrors.name = 'Name is required'
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    
    if (!validateSignInForm()) return
    
    setIsLoading(true)
    
    const result = await onSignIn(email, password, phone)
    
    setIsLoading(false)
    
    if (!result.success) {
      setApiError(result.error || 'Invalid credentials. Please try again or sign up.')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    
    if (!validateSignUpForm()) return
    
    setIsLoading(true)
    
    const result = await onSignUp(name, email, password, phone)
    
    setIsLoading(false)
    
    if (!result.success) {
      setApiError(result.error || 'Failed to create account. Please try again.')
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setErrors({})
    setApiError(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
        {/* Logo */}
        <div className="mb-6 animate-scale-in">
          <div className="relative w-48 h-20">
            <Image
              src="/images/fitonze-logo.png"
              alt="Fitonze"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2 animate-slide-up">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-muted-foreground mb-6 animate-slide-up text-center" style={{ animationDelay: '100ms' }}>
          {mode === 'signin' 
            ? 'Sign in to continue your journey' 
            : 'Join Fitonze to discover opportunities'}
        </p>
        
        {/* API Error */}
        {apiError && (
          <div className="w-full max-w-sm mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg animate-slide-up">
            <p className="text-sm text-destructive text-center">{apiError}</p>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="w-full max-w-sm space-y-4">
          
          {/* Name - Only for Sign Up */}
          {mode === 'signup' && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive pl-1">{errors.name}</p>
              )}
            </div>
          )}
          
          {/* Email */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: mode === 'signup' ? '200ms' : '150ms' }}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive pl-1">{errors.email}</p>
            )}
          </div>
          
          {/* Phone - Required for both Sign In and Sign Up */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: mode === 'signup' ? '250ms' : '200ms' }}>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive pl-1">{errors.phone}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: mode === 'signup' ? '300ms' : '250ms' }}>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 pr-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive pl-1">{errors.password}</p>
            )}
          </div>
          
          {/* Confirm Password - Only for Sign Up */}
          {mode === 'signup' && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '350ms' }}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive pl-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}
          
          {/* Remember Me / Forgot Password - Only for Sign In */}
          {mode === 'signin' && (
            <div className="flex items-center justify-between animate-slide-up" style={{ animationDelay: '250ms' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: mode === 'signup' ? '400ms' : '300ms' }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>
        
        {/* Switch Mode Link */}
        <p className="mt-6 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: mode === 'signup' ? '450ms' : '350ms' }}>
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={switchMode} className="text-primary hover:underline font-medium">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
