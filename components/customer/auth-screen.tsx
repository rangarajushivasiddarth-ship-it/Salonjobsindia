'use client'

import { useState } from 'react'
import { Scissors, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface AuthScreenProps {
  onSubmit: (email: string, password: string, phone: string) => void
  onBack: () => void
}

export function AuthScreen({ onSubmit, onBack }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{7,}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 7+ digit phone number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onSubmit(email, password, phone)
    setIsLoading(false)
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <div className="w-20 h-20 rounded-2xl glass neon-glow flex items-center justify-center">
            <Scissors className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2 animate-slide-up">
          Welcome Back
        </h1>
        <p className="text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          Sign in to continue your journey
        </p>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          {/* Email */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
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
          
          {/* Password */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
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
          
          {/* Phone */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="7-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive pl-1">{errors.phone}</p>
            )}
          </div>
          
          {/* Remember Me */}
          <div className="flex items-center justify-between animate-slide-up" style={{ animationDelay: '300ms' }}>
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
          
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground neon-glow transition-all duration-300 hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: '350ms' }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        
        {/* Sign Up Link */}
        <p className="mt-8 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '400ms' }}>
          {"Don't have an account? "}
          <button className="text-primary hover:underline font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
