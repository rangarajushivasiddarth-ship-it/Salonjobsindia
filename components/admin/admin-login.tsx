'use client'

import { useState } from 'react'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'

export function AdminLogin() {
  const { login } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    setIsLoading(true)
    const success = await login(email, password)
    setIsLoading(false)
    
    if (!success) {
      setError('Invalid credentials. Try admin@salonjobs.com / admin123')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-scale-in">
          <div className="w-20 h-20 rounded-2xl glass neon-glow flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">SalonJobs Management</p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
          
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
            />
          </div>
          
          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-12 bg-secondary/50 border-border/50 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        
        {/* Demo Credentials */}
        <div className="mt-6 p-4 glass-card rounded-xl text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="text-sm text-muted-foreground mb-2">Demo credentials:</p>
          <p className="text-xs font-mono text-primary">admin@salonjobs.com / admin123</p>
        </div>
      </div>
    </div>
  )
}
