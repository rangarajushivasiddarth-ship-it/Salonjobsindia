'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { useLanguage } from '@/lib/language-context'
import { ArrowLeft, Building2, Briefcase, MapPin, Navigation, FileText, Check, X, Phone, Upload, CreditCard, Clock, AlertCircle, Image as ImageIcon, Crown, Users, Edit2, Trash2, Gift, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { submitJobPayment, useApprovalStatus } from '@/lib/hooks/use-realtime-sync'
import { detectLocation as detectLocationFromBrowser, cacheLocation, type LocationData, type GeolocationError } from '@/lib/location-utils'
import Image from 'next/image'

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

const JOB_POST_PRICE = 499

type Step = 'form' | 'payment' | 'pending' | 'success'

interface JobDraft {
  id: string
  salonName: string
  salonMobile: string
  salonLogo?: string
  role: string
  customRole: string
  salary: string
  experience: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'draft' | 'payment_pending' | 'pending_approval' | 'approved' | 'live' | 'rejected'
  paymentScreenshot?: string
  createdAt: Date
}

export function CreateJob() {
  const { user, goToStep } = useApp()
  const [currentStep, setCurrentStep] = useState<Step>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  
  const [formData, setFormData] = useState({
    salonName: '',
    salonMobile: '',
    salonLogo: '',
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
  const [savedJob, setSavedJob] = useState<JobDraft | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Check for existing pending jobs
  useEffect(() => {
    // Guard against server-side rendering
    if (typeof window === 'undefined') return
    
    const pendingJobs = localStorage.getItem(`fitonze_pending_jobs_${user?.id}`)
    if (pendingJobs) {
      const jobs: JobDraft[] = JSON.parse(pendingJobs)
      const pendingJob = jobs.find(j => j.status === 'pending_approval')
      if (pendingJob) {
        setSavedJob(pendingJob)
        setCurrentStep('pending')
      }
    }
  }, [user?.id])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'Please upload an image file' }))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'File size should be less than 2MB' }))
      return
    }

    setUploadingLogo(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, salonLogo: reader.result as string }))
      setUploadingLogo(false)
      setErrors(prev => ({ ...prev, logo: '' }))
    }
    reader.readAsDataURL(file)
  }

  const validateMobileNumber = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\D/g, '')
    return cleaned.length === 10 && /^[6-9]/.test(cleaned)
  }

  const detectLocation = async () => {
    setDetectingLocation(true)
    setErrors(prev => ({ ...prev, location: '' }))
    
    try {
      const locationData = await detectLocationFromBrowser()
      
      setFormData(prev => ({
        ...prev,
        location: {
          lat: locationData.latitude,
          lng: locationData.longitude,
          address: locationData.formattedAddress || locationData.address,
        }
      }))
      
      cacheLocation(locationData)
      setErrors(prev => ({ ...prev, location: '' }))
    } catch (error) {
      const geolocationError = error as GeolocationError
      console.error('[v0] Location detection failed:', geolocationError)
      setErrors(prev => ({ ...prev, location: geolocationError.message }))
    } finally {
      setDetectingLocation(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.salonName.trim()) newErrors.salonName = 'Salon name is required'
    if (!formData.salonMobile.trim()) {
      newErrors.salonMobile = 'Mobile number is required'
    } else if (!validateMobileNumber(formData.salonMobile)) {
      newErrors.salonMobile = 'Enter a valid 10-digit mobile number'
    }
    if (!formData.role && !formData.customRole) newErrors.role = 'Role is required'
    if (!formData.salary) newErrors.salary = 'Salary is required'
    if (!formData.experience) newErrors.experience = 'Experience is required'
    if (!formData.location.address) newErrors.location = 'Location is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinueToPayment = () => {
    if (!validateForm()) return
    setCurrentStep('payment')
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, screenshot: 'Please upload an image file' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, screenshot: 'File size should be less than 5MB' }))
      return
    }

    setUploadingScreenshot(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result as string)
      setUploadingScreenshot(false)
      setErrors(prev => ({ ...prev, screenshot: '' }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitPayment = async () => {
    if (!paymentScreenshot) {
      setErrors(prev => ({ ...prev, screenshot: 'Please upload payment screenshot' }))
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create job draft with pending approval status
    const jobDraft: JobDraft = {
      id: `job_${Date.now()}`,
      ...formData,
      status: 'pending_approval',
      paymentScreenshot,
      createdAt: new Date(),
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const existingJobs = localStorage.getItem(`salonjobsindia_pending_jobs_${user?.id}`)
      const jobs: JobDraft[] = existingJobs ? JSON.parse(existingJobs) : []
      jobs.push(jobDraft)
      localStorage.setItem(`salonjobsindia_pending_jobs_${user?.id}`, JSON.stringify(jobs))
    }
    
    // IMPORTANT: Submit to cloud sync API for cross-device real-time sync
    const cloudResult = await submitJobPayment({
      salonId: user?.id || '',
      salonName: formData.salonName,
      ownerName: user?.name || '',
      ownerPhone: user?.phone || '',
      ownerEmail: user?.email,
      jobTitle: formData.role || formData.customRole || 'Job Posting',
      jobDetails: {
        ...formData,
        salary: formData.salary,
        experience: formData.experience,
        location: formData.location,
      },
      planId: 'single_job_post',
      planName: 'Job Posting',
      planPrice: JOB_POST_PRICE,
      screenshotUrl: paymentScreenshot,
    })
    
    if (cloudResult.success) {
      // Successfully submitted to cloud
    } else {
      console.error('[CreateJob] Cloud sync failed:', cloudResult.error)
    }
    
    setSavedJob(jobDraft)
    setIsLoading(false)
    setCurrentStep('pending')
  }

  // Pending Approval Screen - with real-time approval checking
  if (currentStep === 'pending') {
    return (
      <PendingApprovalScreen 
        savedJob={savedJob} 
        user={user} 
        goToStep={(step) => setCurrentStep(step as Step)}
        formData={formData}
      />
    )
  }

  // Success Screen
  if (currentStep === 'success') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        
        <div className="relative z-10 text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 gold-glow">
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

  // Payment Step
  if (currentStep === 'payment') {
    return (
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        
        {/* Header */}
        <header className="relative z-10 p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep('form')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Complete Payment</h1>
        </header>
        
        <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            {/* Price Card */}
            <div className="p-6 glass-card rounded-2xl text-center animate-slide-up">
              <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Job Post Fee</h2>
              <p className="text-4xl font-bold text-primary mb-2">₹{JOB_POST_PRICE}</p>
              <p className="text-sm text-muted-foreground">One-time payment per job post</p>
            </div>
            
            {/* What You Get - Benefits */}
            <div className="p-4 glass-card rounded-xl animate-slide-up border-2 border-primary/30" style={{ animationDelay: '25ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">What You Get</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Job Post</p>
                    <p className="text-xs text-muted-foreground">Live for 30 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">30 Credits</p>
                    <p className="text-xs text-muted-foreground">Unlock contacts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Unlimited</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Edit2 className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">3 Edits</p>
                    <p className="text-xs text-muted-foreground">Modify anytime</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-xs text-center">
                  <span className="font-medium text-accent">Bonus:</span> Delete job anytime + View all applicant profiles
                </p>
              </div>
            </div>
            
            {/* Job Summary */}
            <div className="p-4 glass-card rounded-xl animate-slide-up" style={{ animationDelay: '50ms' }}>
              <h3 className="font-semibold mb-3">Job Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salon:</span>
                  <span>{formData.salonName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span>{formData.role || formData.customRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary:</span>
                  <span>{formData.salary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-right max-w-[50%] truncate">{formData.location.address}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Instructions */}
            <div className="p-4 glass-card rounded-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h3 className="font-semibold mb-3">How to Pay</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                  <span>Scan the QR code below or pay to UPI: <strong>fitonze@upi</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                  <span>Pay exactly <strong>₹{JOB_POST_PRICE}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">3</span>
                  <span>Take a screenshot of the payment confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">4</span>
                  <span>Upload the screenshot below</span>
                </li>
              </ol>
            </div>
            
            {/* QR Code */}
            <div className="p-6 glass-card rounded-xl text-center animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="w-48 h-48 mx-auto bg-white rounded-xl p-3 mb-4">
                <Image
                  src="/images/payment-qr.jpg"
                  alt="Payment QR Code"
                  width={180}
                  height={180}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">UPI: fitonze@upi</p>
            </div>
            
            {/* Screenshot Upload */}
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <label className="text-sm font-medium">Upload Payment Screenshot</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-input"
                />
                
                {paymentScreenshot ? (
                  <div className="relative">
                    <img
                      src={paymentScreenshot}
                      alt="Payment screenshot"
                      className="w-full h-48 object-cover rounded-xl border-2 border-primary/50"
                    />
                    <button
                      onClick={() => setPaymentScreenshot(null)}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <label
                      htmlFor="screenshot-input"
                      className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/80 rounded-lg text-sm cursor-pointer hover:bg-background"
                    >
                      Change
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="screenshot-input"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    {uploadingScreenshot ? (
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                        <span className="text-sm font-medium text-muted-foreground">Click to upload screenshot</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              {errors.screenshot && <p className="text-sm text-destructive">{errors.screenshot}</p>}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleSubmitPayment}
              disabled={isLoading || !paymentScreenshot}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 gold-glow disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                'Submit Payment'
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Your job will be published after payment verification
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Form Step
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep('owner-panel')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Post a Job</h1>
          <p className="text-xs text-muted-foreground">₹{JOB_POST_PRICE} per job post</p>
        </div>
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
          
          {/* Salon Logo - Optional */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '15ms' }}>
            <label className="text-sm font-medium text-muted-foreground">
              Salon Logo <span className="text-xs text-muted-foreground/60">(Optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-input"
                />
                {formData.salonLogo ? (
                  <div className="relative">
                    <img
                      src={formData.salonLogo}
                      alt="Salon logo"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, salonLogo: '' }))}
                      className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="logo-input"
                    className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    {uploadingLogo ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Add your salon logo to make your job post stand out
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
            {errors.logo && <p className="text-sm text-destructive">{errors.logo}</p>}
          </div>
          
          {/* Salon Mobile Number - NEW FIELD */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '25ms' }}>
            <label className="text-sm font-medium text-muted-foreground">Salon Mobile Number *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.salonMobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setFormData(prev => ({ ...prev, salonMobile: value }))
                }}
                className="h-14 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
                maxLength={10}
              />
            </div>
            {errors.salonMobile && <p className="text-sm text-destructive">{errors.salonMobile}</p>}
            {formData.salonMobile && validateMobileNumber(formData.salonMobile) && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="w-4 h-4" />
                Valid mobile number
              </div>
            )}
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
          
          {/* Price Notice */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Job Post Fee: ₹{JOB_POST_PRICE}</p>
                <p className="text-sm text-muted-foreground">Payment required after form submission</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleContinueToPayment}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground gold-glow"
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}

// Pending Approval Screen Component with real-time approval checking
function PendingApprovalScreen({ 
  savedJob, 
  user, 
  goToStep,
  formData,
}: { 
  savedJob: JobDraft | null
  user: { id: string; name?: string } | null | undefined
  goToStep: (step: string) => void
  formData: {
    salonName: string
    salonMobile: string
    salonLogo: string
    role: string
    customRole: string
    salary: string
    experience: string
    description: string
    location: { lat: number; lng: number; address: string }
  }
}) {
  const { isApproved, approvalData, isChecking } = useApprovalStatus(user?.id, 2000)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // When approved, create the job locally and show success
  useEffect(() => {
    // Guard against server-side rendering
    if (typeof window === 'undefined') return
    
    if (isApproved && approvalData) {
      // Create the job in localStorage if not already done by the hook
      const jobsStr = localStorage.getItem('salonjobsindia_jobs')
      const jobs = jobsStr ? JSON.parse(jobsStr) : []
      
      // Check if job already exists
      const existingJob = jobs.find((j: { salonId?: string; salonName?: string; role?: string }) => 
        j.salonId === user?.id && 
        j.salonName === formData.salonName && 
        j.role === (formData.role || formData.customRole)
      )
      
      if (!existingJob) {
        const newJob = {
          id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          salonId: user?.id,
          salonName: formData.salonName,
          salonMobile: formData.salonMobile,
          salonLogo: formData.salonLogo,
          role: formData.role || formData.customRole,
          salary: formData.salary,
          experience: formData.experience,
          description: formData.description,
          location: formData.location,
          status: 'live',
          isActive: true,
          isVerified: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentApprovedAt: new Date().toISOString(),
        }
        
        jobs.push(newJob)
        localStorage.setItem('salonjobsindia_jobs', JSON.stringify(jobs))
        
        // Update salon profile with 30 free credits if first job
        const profilesStr = localStorage.getItem('salonjobsindia_salon_profiles')
        const profiles = profilesStr ? JSON.parse(profilesStr) : []
        const profileIndex = profiles.findIndex((p: { ownerId: string }) => p.ownerId === user?.id)
        
        if (profileIndex >= 0) {
          const profile = profiles[profileIndex]
          if (!profile.contactCredits || profile.contactCredits === 0) {
            profile.contactCredits = 30
            localStorage.setItem('salonjobsindia_salon_profiles', JSON.stringify(profiles))
          }
        }
        
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('salonjobsindia_data_updated', { detail: { key: 'salonjobsindia_jobs' } }))
      }
      
      setShowSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        console.log('[v0] CreateJob - Redirecting to owner-panel after approval')
        goToStep('owner-panel')
      }, 2000)
    }
  }, [isApproved, approvalData, user?.id, formData]) // REMOVED goToStep - function reference changes every render
  
  if (showSuccess) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        
        <div className="relative z-10 text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 gold-glow">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Job Approved!</h1>
          <p className="text-muted-foreground mb-2">Your job listing is now live</p>
          <p className="text-sm text-primary">+ 30 Free Contact Credits Added!</p>
          <p className="text-xs text-muted-foreground mt-4">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" />
      
      <div className="relative z-10 text-center max-w-md animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          {isChecking ? (
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <Clock className="w-12 h-12 text-accent" />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-3">Payment Under Review</h1>
        <p className="text-muted-foreground mb-6">
          Your payment is being verified by our team. This page will automatically update once approved.
        </p>
        
        <div className="p-4 glass-card rounded-xl mb-6 text-left">
          <h3 className="font-semibold mb-3">Job Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salon:</span>
              <span>{savedJob?.salonName || formData.salonName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span>{savedJob?.role || savedJob?.customRole || formData.role || formData.customRole}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-accent flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Pending Approval
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span>Rs.499</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-left">
              Once approved, your job post will go live automatically and you will receive 30 free contact credits!
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => goToStep('owner-panel')}
          className="w-full h-12 bg-primary hover:bg-primary/90"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
