'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, QrCode, Upload, Check, Clock, Shield, MapPin, Phone, FileText, X, Image as ImageIcon, Crown, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { JOB_SEEKER_PLANS, saveSubscription, getSubscriptionByUserId } from '@/lib/data-store'
import type { Subscription, JobSeekerPlanType } from '@/lib/types'

export function SubscriptionScreen() {
  const { user, setSubscription, goToStep } = useApp()
  const [selectedPlan, setSelectedPlan] = useState<JobSeekerPlanType>('basic')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [existingPending, setExistingPending] = useState<Subscription | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for existing pending subscription
  useEffect(() => {
    if (user?.id) {
      const existing = getSubscriptionByUserId(user.id)
      if (existing && existing.status === 'pending') {
        setExistingPending(existing)
        setIsSubmitted(true)
      } else if (existing && existing.status === 'approved') {
        // Already approved, redirect to results
        goToStep('results')
      }
    }
  }, [user?.id, goToStep])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const selectedPlanDetails = JOB_SEEKER_PLANS.find(p => p.id === selectedPlan)!

  const handleSubmit = async () => {
    if (!uploadedFile || !user) return
    
    setIsSubmitting(true)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Calculate expiry date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name || user.email,
      userPhone: user.phone,
      screenshotUrl: previewUrl || '',
      status: 'pending', // IMPORTANT: Status is PENDING until admin approves
      planType: selectedPlan,
      shopLimit: selectedPlanDetails.shopLimit,
      shopsViewed: 0,
      createdAt: new Date(),
      expiresAt: expiresAt,
    }
    
    // Save to shared data store (available to admin)
    saveSubscription(subscription)
    
    // Update local state
    setSubscription(subscription)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const benefits = [
    { icon: MapPin, text: 'View salons within 20km radius' },
    { icon: Phone, text: 'Access contact information' },
    { icon: FileText, text: 'See full job descriptions' },
    { icon: Shield, text: '30 days unlimited access' },
  ]

  // Show pending status screen
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
            Admin will verify and approve your subscription. You will receive a WhatsApp notification once approved.
          </p>
          
          <div className="p-4 glass-card rounded-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold">{existingPending?.planType ? JOB_SEEKER_PLANS.find(p => p.id === existingPending.planType)?.name : selectedPlanDetails.name}</span>
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
            onClick={() => goToStep('discovery')}
            className="w-full h-12"
          >
            Back to Discovery
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
      <header className="relative z-10 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep('discovery')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-6 animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-muted-foreground">Select a plan to unlock salon details</p>
          </div>
          
          {/* Plan Selection */}
          <div className="space-y-3 mb-6">
            {JOB_SEEKER_PLANS.map((plan, index) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full p-4 rounded-xl text-left transition-all duration-300 animate-slide-up ${
                  selectedPlan === plan.id
                    ? 'glass-card gold-glow border-2 border-primary'
                    : 'glass-card border border-border/50 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedPlan === plan.id ? 'bg-primary/20' : 'bg-secondary/50'
                    }`}>
                      {plan.id === 'unlimited' ? (
                        <Crown className={`w-6 h-6 ${selectedPlan === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      ) : (
                        <Sparkles className={`w-6 h-6 ${selectedPlan === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">₹{plan.price}</p>
                    <p className="text-xs text-muted-foreground">30 days</p>
                  </div>
                </div>
                {plan.id === 'unlimited' && (
                  <div className="mt-3 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-medium inline-block">
                    Best Value
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-4 glass-card rounded-xl animate-slide-up"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <benefit.icon className="w-6 h-6 text-primary mb-2" />
                <p className="text-sm text-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
          
          {/* QR Code Section */}
          <div className="p-6 glass-card rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Scan to Pay</h3>
                <p className="text-xs text-muted-foreground">Use any UPI app</p>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="w-full aspect-square max-w-[200px] mx-auto bg-white rounded-xl flex items-center justify-center mb-4 overflow-hidden">
              <Image
                src="/images/payment-qr.png"
                alt="Payment QR Code"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">₹{selectedPlanDetails.price}</p>
              <p className="text-xs text-muted-foreground">
                {selectedPlanDetails.name} Plan - {typeof selectedPlanDetails.shopLimit === 'number' ? `${selectedPlanDetails.shopLimit} shops` : 'Unlimited shops'}
              </p>
            </div>
          </div>
          
          {/* Upload Section */}
          <div className="p-6 glass-card rounded-2xl animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Upload Payment Screenshot</h3>
                <p className="text-xs text-muted-foreground">After completing payment</p>
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
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors mb-4"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
              </button>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Scan the QR code and pay ₹{selectedPlanDetails.price}</p>
              <p>2. Take a screenshot of the payment confirmation</p>
              <p>3. Upload the screenshot above</p>
              <p>4. Wait for admin approval (you&apos;ll get WhatsApp notification)</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!uploadedFile || isSubmitting}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Submit for Verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
