'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, QrCode, Upload, Check, Clock, Shield, MapPin, Phone, FileText, X, Image as ImageIcon, Crown, Sparkles, Star, Zap, Building2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { JOB_SEEKER_PLANS, SALON_OWNER_PLANS, saveSubscription, getSubscriptionByUserId } from '@/lib/data-store'
import type { Subscription, JobSeekerPlanType } from '@/lib/types'

export function SubscriptionScreen() {
  const { user, setSubscription, goToStep } = useApp()
  const isOwner = user?.role === 'salon_owner'
  
  const [selectedPlan, setSelectedPlan] = useState<string>(isOwner ? 'single_post' : 'premium')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [existingPending, setExistingPending] = useState<Subscription | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const plans = isOwner ? SALON_OWNER_PLANS : JOB_SEEKER_PLANS

  // Check for existing pending subscription
  useEffect(() => {
    if (user?.id) {
      const existing = getSubscriptionByUserId(user.id)
      if (existing && existing.status === 'pending') {
        setExistingPending(existing)
        setIsSubmitted(true)
      } else if (existing && existing.status === 'approved') {
        goToStep(isOwner ? 'owner-panel' : 'results')
      }
    }
  }, [user?.id, goToStep, isOwner])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan)!

  const handleSubmit = async () => {
    if (!uploadedFile || !user) return
    
    setIsSubmitting(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const validityDays = isOwner 
      ? (selectedPlanDetails as typeof SALON_OWNER_PLANS[0]).validityDays 
      : 30
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validityDays)
    
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name || user.email,
      userPhone: user.phone,
      userRole: user.role,
      planType: selectedPlan as JobSeekerPlanType,
      planName: selectedPlanDetails.name,
      amount: selectedPlanDetails.price,
      screenshotUrl: previewUrl || '',
      paymentMethod: 'upi',
      status: 'pending',
      shopLimit: !isOwner ? (selectedPlanDetails as typeof JOB_SEEKER_PLANS[0]).shopLimit : undefined,
      shopsViewed: 0,
      jobPostsTotal: isOwner ? (selectedPlanDetails as typeof SALON_OWNER_PLANS[0]).jobPosts : undefined,
      jobPostsUsed: 0,
      createdAt: new Date(),
      expiresAt: expiresAt,
    }
    
    saveSubscription(subscription)
    setSubscription(subscription)
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const getPlanIcon = (planId: string) => {
    if (planId === 'gold' || planId === 'single_post') return <Star className="w-6 h-6" />
    if (planId === 'premium' || planId === 'triple_post') return <Crown className="w-6 h-6" />
    return <Zap className="w-6 h-6" />
  }

  const getPlanColor = (planId: string) => {
    if (planId === 'gold') return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
    if (planId === 'premium') return 'from-slate-400/20 to-gray-500/20 border-slate-400/50'
    if (planId === 'ultra_premium') return 'from-rose-500/20 to-pink-500/20 border-rose-500/50'
    if (planId === 'single_post') return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50'
    if (planId === 'triple_post') return 'from-purple-500/20 to-violet-500/20 border-purple-500/50'
    return 'from-emerald-500/20 to-green-500/20 border-emerald-500/50'
  }

  // Pending status screen
  if (isSubmitted) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        
        <div className="relative z-10 text-center animate-scale-in max-w-sm">
          <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Payment Under Review</h1>
          <p className="text-muted-foreground mb-2">Your payment screenshot has been submitted</p>
          <p className="text-sm text-muted-foreground mb-6">
            Admin will verify and approve within 2-4 hours. You&apos;ll receive a WhatsApp notification once approved.
          </p>
          
          <div className="p-4 glass-card rounded-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold">{existingPending?.planName || selectedPlanDetails.name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-semibold text-primary">Rs.{existingPending?.amount || selectedPlanDetails.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="flex items-center gap-2 text-amber-500">
                <Clock className="w-4 h-4 animate-pulse" />
                Pending Approval
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => goToStep(isOwner ? 'owner-panel' : 'discovery')}
            className="w-full h-12"
          >
            {isOwner ? 'Go to Dashboard' : 'Back to Discovery'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep(isOwner ? 'owner-panel' : 'discovery')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold">{isOwner ? 'Post a Job' : 'Unlock Salons'}</h1>
          <p className="text-xs text-muted-foreground">Choose your plan</p>
        </div>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 px-4 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* User Type Badge */}
          <div className="flex items-center justify-center mb-4">
            <div className="px-4 py-2 glass-card rounded-full flex items-center gap-2">
              {isOwner ? (
                <>
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Salon Owner Plans</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Job Seeker Plans</span>
                </>
              )}
            </div>
          </div>
          
          {/* Plan Cards */}
          <div className="space-y-3 mb-6">
            {plans.map((plan, index) => {
              const isSelected = selectedPlan === plan.id
              const isRecommended = 'recommended' in plan && plan.recommended
              
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 animate-slide-up relative overflow-hidden ${
                    isSelected
                      ? `bg-gradient-to-r ${getPlanColor(plan.id)} border-2`
                      : 'glass-card border border-border/50 hover:border-primary/30'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-xl">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {getPlanIcon(plan.id)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">Rs.{plan.price}</p>
                          {'validityDays' in plan && (
                            <p className="text-xs text-muted-foreground">{plan.validityDays} days</p>
                          )}
                          {'shopLimit' in plan && (
                            <p className="text-xs text-muted-foreground">
                              {plan.shopLimit === 'unlimited' ? 'Unlimited' : `${plan.shopLimit} shops`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-1 mt-2">
                        {plan.features.slice(0, isSelected ? 6 : 2).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>{feature}</span>
                          </div>
                        ))}
                        {!isSelected && plan.features.length > 2 && (
                          <p className="text-xs text-primary ml-6">+{plan.features.length - 2} more benefits</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* QR Code Section */}
          <div className="p-5 glass-card rounded-2xl mb-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Scan to Pay</h3>
                <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm, any UPI</p>
              </div>
            </div>
            
            <div className="w-full aspect-square max-w-[180px] mx-auto bg-white rounded-xl flex items-center justify-center mb-4 overflow-hidden">
              <Image
                src="/images/payment-qr.jpg"
                alt="Payment QR Code"
                width={180}
                height={180}
                className="object-contain w-auto h-auto"
              />
            </div>
            
            <div className="text-center p-3 bg-primary/10 rounded-xl">
              <p className="text-3xl font-bold text-primary">Rs.{selectedPlanDetails.price}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedPlanDetails.name} Plan</p>
            </div>
          </div>
          
          {/* Upload Section */}
          <div className="p-5 glass-card rounded-2xl animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Upload Payment Proof</h3>
                <p className="text-xs text-muted-foreground">Screenshot of successful payment</p>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative mb-4">
                <img
                  src={previewUrl}
                  alt="Payment screenshot"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={() => {
                    setUploadedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500/90 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Ready to submit
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all mb-4"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">Tap to upload screenshot</span>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG supported</p>
                </div>
              </button>
            )}
            
            {/* Steps */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                <p className="text-muted-foreground">Scan QR and pay Rs.{selectedPlanDetails.price}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                <p className="text-muted-foreground">Take screenshot of payment confirmation</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                <p className="text-muted-foreground">Upload screenshot and submit</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                <p className="text-muted-foreground">Get approved within 2-4 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!uploadedFile || isSubmitting}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Secure payment verification by FITONE team
          </p>
        </div>
      </div>
    </div>
  )
}
