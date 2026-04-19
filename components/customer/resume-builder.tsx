'use client'

import { useState } from 'react'
import { ArrowLeft, User, Briefcase, Clock, DollarSign, MapPin, Navigation, X, Plus, Check, Crown, Upload, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import type { Resume } from '@/lib/types'

const SKILL_SUGGESTIONS = [
  'Hair Cutting', 'Hair Coloring', 'Styling', 'Bridal Makeup',
  'Manicure', 'Pedicure', 'Facial', 'Threading', 'Waxing',
  'Massage', 'Hair Treatment', 'Keratin', 'Balayage', 'Highlights'
]

const ROLE_SUGGESTIONS = [
  'Hair Stylist', 'Makeup Artist', 'Nail Technician', 'Beautician',
  'Salon Manager', 'Receptionist', 'Spa Therapist', 'Barber', 'Custom'
]

export function ResumeBuilder() {
  const { user, setResume, goToStep } = useApp()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    dateOfBirth: '',
    experience: '',
    skills: [] as string[],
    salaryExpectation: '',
    location: {
      lat: 0,
      lng: 0,
      address: '',
    },
    identityProof: {
      type: '',
      file: null as File | null,
      preview: '',
    },
    passportPhoto: {
      file: null as File | null,
      preview: '',
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customSkill, setCustomSkill] = useState('')
  const IDENTITY_PROOF_OPTIONS = ['Aadhar', 'Voter ID', 'PAN', 'Driving License', 'Custom']

  const handleIdentityProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          identityProof: {
            ...prev.identityProof,
            file,
            preview: reader.result as string,
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePassportPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          passportPhoto: {
            file,
            preview: reader.result as string,
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const detectLocation = async () => {
    setDetectingLocation(true)
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Reverse geocode to get city, area, and town
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )
            const data = await response.json()
            
            const address = data.address || {}
            const town = address.suburb || address.neighbourhood || address.hamlet || ''
            const area = address.city_district || address.county || address.state_district || ''
            const city = address.city || address.town || address.village || address.municipality || ''
            
            // Build display string with available parts
            const locationParts = [town, area, city].filter(Boolean)
            const displayAddress = locationParts.length > 0 
              ? locationParts.join(', ')
              : 'Location Detected'
            
            setFormData(prev => ({
              ...prev,
              location: {
                lat: latitude,
                lng: longitude,
                address: displayAddress,
              }
            }))
          } catch {
            // Fallback if geocoding fails
            setFormData(prev => ({
              ...prev,
              location: {
                lat: latitude,
                lng: longitude,
                address: 'Location Detected',
              }
            }))
          }
          
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

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (!formData.role.trim()) newErrors.role = 'Role is required'
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    } else if (step === 2) {
      if (!formData.experience) newErrors.experience = 'Experience is required'
      if (formData.skills.length === 0) newErrors.skills = 'Select at least one skill'
    } else if (step === 3) {
      if (!formData.identityProof.type) newErrors.identityProof = 'Identity proof type is required'
      if (!formData.identityProof.file) newErrors.identityProofFile = 'Identity proof document is required'
      if (!formData.passportPhoto.file) newErrors.passportPhoto = 'Passport size photo is required'
    } else if (step === 4) {
      if (!formData.salaryExpectation) newErrors.salary = 'Salary expectation is required'
      if (!formData.location.address) newErrors.location = 'Location is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleSubmit = async () => {
    // Check if user is subscribed
    if (!user?.isSubscribed) {
      setShowSubscriptionModal(true)
      return
    }
    
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const resume: Resume = {
      id: crypto.randomUUID(),
      userId: user?.id || '',
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    setResume(resume)
    setIsLoading(false)
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }
  
  const addCustomSkill = () => {
    if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, customSkill.trim()]
      }))
      setCustomSkill('')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step > 1 ? setStep(step - 1) : goToStep('role')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        <div className="w-10" />
      </header>
      
      {/* Progress Bar */}
      <div className="relative z-10 px-6 mb-6">
        <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="max-w-md mx-auto animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Build Your Resume</h1>
            <p className="text-muted-foreground mb-8">Let&apos;s start with your basic information</p>
            
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Desired Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Hair Stylist"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                
                {/* Role suggestions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {ROLE_SUGGESTIONS.map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        if (role === 'Custom') {
                          // Clear the role to let user type their own
                          setFormData(prev => ({ ...prev, role: '' }))
                          // Focus the input
                          const input = document.querySelector('input[placeholder="e.g. Hair Stylist"]') as HTMLInputElement
                          input?.focus()
                        } else {
                          setFormData(prev => ({ ...prev, role }))
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        role === 'Custom'
                          ? 'bg-accent/20 text-accent hover:bg-accent/30 border border-dashed border-accent/50'
                          : formData.role === role
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {role === 'Custom' ? '+ Custom Role' : role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Experience & Skills */}
        {step === 2 && (
          <div className="max-w-md mx-auto animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Your Experience</h1>
            <p className="text-muted-foreground mb-8">Tell us about your skills and experience</p>
            
            <div className="space-y-6">
              {/* Experience */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Years of Experience</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full h-14 pl-12 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none appearance-none text-foreground"
                  >
                    <option value="">Select experience</option>
                    <option value="fresher">Fresher (0-1 years)</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
              </div>
              
              {/* Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Skills <span className="text-primary">({formData.skills.length} selected)</span>
                </label>
                
                {/* Selected skills */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg mb-3">
                    {formData.skills.map(skill => (
                      <span
                        key={skill}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/20 text-primary rounded-full"
                      >
                        {skill}
                        <button onClick={() => toggleSkill(skill)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Skill suggestions */}
                <div className="flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="px-3 py-1.5 text-sm rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      {skill}
                    </button>
                  ))}
                </div>
                
                {/* Custom skill */}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Add custom skill"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                    className="flex-1 h-12 bg-secondary/50 border-border/50"
                  />
                  <Button onClick={addCustomSkill} size="icon" className="h-12 w-12 bg-primary">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                
                {errors.skills && <p className="text-sm text-destructive">{errors.skills}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Identity & Passport Photos */}
        {step === 3 && (
          <div className="max-w-md mx-auto animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Verification Documents</h1>
            <p className="text-muted-foreground mb-8">Upload your identity proof and passport size photo</p>
            
            <div className="space-y-6">
              {/* Identity Proof Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Identity Proof Type</label>
                <select
                  value={formData.identityProof.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    identityProof: { ...prev.identityProof, type: e.target.value }
                  }))}
                  className="w-full h-14 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none appearance-none text-foreground"
                >
                  <option value="">Select identity proof type</option>
                  {IDENTITY_PROOF_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.identityProof && <p className="text-sm text-destructive">{errors.identityProof}</p>}
              </div>

              {/* Identity Proof Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Upload Identity Proof</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdentityProofChange}
                    className="hidden"
                    id="identity-proof-input"
                  />
                  <label
                    htmlFor="identity-proof-input"
                    className="flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {formData.identityProof.file ? 'Click to change' : 'Click to upload'}
                    </span>
                    <span className="text-xs text-muted-foreground/60">PNG, JPG, PDF</span>
                  </label>
                </div>
                {formData.identityProof.file && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary">{formData.identityProof.file.name}</span>
                  </div>
                )}
                {errors.identityProofFile && <p className="text-sm text-destructive">{errors.identityProofFile}</p>}
              </div>

              {/* Passport Photo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Passport Size Photo</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePassportPhotoChange}
                    className="hidden"
                    id="passport-photo-input"
                  />
                  <label
                    htmlFor="passport-photo-input"
                    className="flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {formData.passportPhoto.file ? 'Click to change' : 'Click to upload'}
                    </span>
                    <span className="text-xs text-muted-foreground/60">PNG, JPG (4x6 recommended)</span>
                  </label>
                </div>
                {formData.passportPhoto.file && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary">{formData.passportPhoto.file.name}</span>
                  </div>
                )}
                {errors.passportPhoto && <p className="text-sm text-destructive">{errors.passportPhoto}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Salary & Location */}
        {step === 4 && (
          <div className="max-w-md mx-auto animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Final Details</h1>
            <p className="text-muted-foreground mb-8">Set your salary expectations and location</p>
            
            <div className="space-y-6">
              {/* Salary */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Salary Expectation (per month)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={formData.salaryExpectation}
                    onChange={(e) => setFormData(prev => ({ ...prev, salaryExpectation: e.target.value }))}
                    className="w-full h-14 pl-12 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none appearance-none text-foreground"
                  >
                    <option value="">Select salary range</option>
                    <option value="10000-15000">₹10,000 - ₹15,000</option>
                    <option value="15000-25000">₹15,000 - ₹25,000</option>
                    <option value="25000-40000">₹25,000 - ₹40,000</option>
                    <option value="40000-60000">₹40,000 - ₹60,000</option>
                    <option value="60000+">₹60,000+</option>
                  </select>
                </div>
                {errors.salary && <p className="text-sm text-destructive">{errors.salary}</p>}
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Your Location</label>
                
                {/* Auto-detect button */}
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
                
                {/* Manual input */}
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
        )}
      </div>
      
      {/* Footer */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : step === 4 ? (
              'Create Job Alert'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
      
      {/* Subscription Required Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Subscription Required</h3>
              <p className="text-muted-foreground mb-6">
                To create a job alert and get matched with salons, you need an active subscription.
              </p>
              
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowSubscriptionModal(false)
                    goToStep('subscription')
                  }}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 gold-glow"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
