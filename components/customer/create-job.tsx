'use client'

import { useState } from 'react'
import { ArrowLeft, Building2, Briefcase, DollarSign, Clock, MapPin, Navigation, FileText, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'

const ROLE_OPTIONS = [
  'Hair Stylist', 'Makeup Artist', 'Nail Technician', 'Beautician',
  'Salon Manager', 'Receptionist', 'Spa Therapist', 'Barber', 'Other'
]

const EXPERIENCE_OPTIONS = [
  'Fresher (0-1 years)', '1-2 years', '2-5 years', '5-10 years', '10+ years'
]

const SALARY_OPTIONS = [
  '₹10,000 - ₹15,000', '₹15,000 - ₹25,000', '₹25,000 - ₹40,000',
  '₹40,000 - ₹60,000', '₹60,000+', 'Negotiable'
]

export function CreateJob() {
  const { user, goToStep } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  
  const [formData, setFormData] = useState({
    salonName: '',
    role: '',
    customRole: '',
    salary: '',
    experience: '',
    description: '',
    location: {
      lat: 0,
      lng: 0,
      address: '',
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const detectLocation = async () => {
    setDetectingLocation(true)
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setFormData(prev => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              address: 'Current Location Detected',
            }
          }))
          setDetectingLocation(false)
        },
        () => {
          setDetectingLocation(false)
          setErrors(prev => ({ ...prev, location: 'Could not detect location' }))
        }
      )
    } else {
      setDetectingLocation(false)
      setErrors(prev => ({ ...prev, location: 'Geolocation not supported' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.salonName.trim()) newErrors.salonName = 'Salon name is required'
    if (!formData.role && !formData.customRole) newErrors.role = 'Role is required'
    if (!formData.salary) newErrors.salary = 'Salary is required'
    if (!formData.experience) newErrors.experience = 'Experience is required'
    if (!formData.location.address) newErrors.location = 'Location is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSuccess(true)
    
    // Navigate to owner panel after success
    setTimeout(() => {
      goToStep('owner-panel')
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        
        <div className="relative z-10 text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 neon-glow">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Job Posted!</h1>
          <p className="text-muted-foreground mb-2">Your job listing is now live</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep('role')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Post a Job</h1>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          {/* Salon Name */}
          <div className="space-y-2 animate-slide-up">
            <label className="text-sm font-medium text-muted-foreground">Salon Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Enter your salon name"
                value={formData.salonName}
                onChange={(e) => setFormData(prev => ({ ...prev, salonName: e.target.value }))}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
            {errors.salonName && <p className="text-sm text-destructive">{errors.salonName}</p>}
          </div>
          
          {/* Role Selection */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Role Required</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role}
                  onClick={() => setFormData(prev => ({ ...prev, role, customRole: role === 'Other' ? prev.customRole : '' }))}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${
                    formData.role === role
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {formData.role === 'Other' && (
              <div className="relative mt-2">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Specify role"
                  value={formData.customRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                />
              </div>
            )}
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>
          
          {/* Salary */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Salary Range</label>
            <div className="flex flex-wrap gap-2">
              {SALARY_OPTIONS.map(salary => (
                <button
                  key={salary}
                  onClick={() => setFormData(prev => ({ ...prev, salary }))}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${
                    formData.salary === salary
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {salary}
                </button>
              ))}
            </div>
            {errors.salary && <p className="text-sm text-destructive">{errors.salary}</p>}
          </div>
          
          {/* Experience */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Experience Required</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map(exp => (
                <button
                  key={exp}
                  onClick={() => setFormData(prev => ({ ...prev, experience: exp }))}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${
                    formData.experience === exp
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
            {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
          </div>
          
          {/* Description */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Job Description (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
              <textarea
                placeholder="Describe the job requirements..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Salon Location</label>
            
            <Button
              onClick={detectLocation}
              disabled={detectingLocation}
              variant="outline"
              className="w-full h-14 border-primary/50 text-primary hover:bg-primary/10"
            >
              {detectingLocation ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              ) : (
                <Navigation className="w-5 h-5 mr-2" />
              )}
              {detectingLocation ? 'Detecting...' : 'Auto-detect Location'}
            </Button>
            
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Or enter address manually"
                value={formData.location.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: e.target.value } 
                }))}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
            
            {formData.location.address && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm text-primary">{formData.location.address}</span>
              </div>
            )}
            
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground neon-glow transition-all duration-300 hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Post Job
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
