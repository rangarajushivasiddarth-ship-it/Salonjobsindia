'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Check, Clock, Crown, Phone, AlertCircle, BadgeCheck, Shield, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { savePayment, getSalonProfileByOwnerId } from '@/lib/data-store'
import type { Payment, SalonOwnerPlanType, PaymentType } from '@/lib/types'

interface SelectedPack {
  id: string
  name: string
  credits?: number
  price: number
  features: string[]
  recommended?: boolean
  type?: 'verified_badge' | 'contact_pack'
  validityDays?: number
  durationMonths?: number
}

// QR Code and UPI details - admin can change these
const PAYMENT_CONFIG = {
  upiId: 'salonjobsindia@upi',
  qrCodeUrl: '/qr-code.png', // Replace with actual QR code
  supportPhone: '+91 9100609609',
}

export function CreditPayment() {
  const { user, goToStep } = useApp()
  const [selectedPack, setSelectedPack] = useState<SelectedPack | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Determine if this is a verified badge purchase
  const isVerifiedBadge = selectedPack?.type === 'verified_badge'

  useEffect(() => {
    // Load selected pack from localStorage
    const packStr = localStorage.getItem('salonjobsindia_selected_credit_pack')
    if (packStr) {
      try {
        setSelectedPack(JSON.parse(packStr))
      } catch {
        // Invalid pack, go back
        console.log('[v0] CreditPayment - Invalid pack, redirecting to owner-panel')
        goToStep('owner-panel')
      }
    } else {
      console.log('[v0] CreditPayment - No pack selected, redirecting to owner-panel')
      goToStep('owner-panel')
    }
  }, []) // REMOVED goToStep - runs on mount only, redirects if no pack found

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload to Supabase Storage
      const response = await fetch('/api/upload/screenshot', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const { url } = await response.json()
      
      setScreenshotFile(file)
      setScreenshotPreview(url)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed'
      console.error('[v0] Upload error:', errorMsg)
      setUploadError(errorMsg)
      setScreenshotFile(null)
      setScreenshotPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || !selectedPack || !screenshotPreview) return

    setIsSubmitting(true)
    setUploadError(null)

    try {
      console.log('[v0] Submitting payment:', { userId: user.id, amount: selectedPack.price, type: isVerifiedBadge ? 'verified_badge' : 'contact_pack' })
      
      // Submit payment to backend API
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: selectedPack.price,
          screenshotUrl: screenshotPreview,
          type: isVerifiedBadge ? 'verified_badge' : 'contact_pack',
          planId: selectedPack.id,
          credits: selectedPack.credits || 0,
          validityDays: selectedPack.validityDays || 365,
          durationMonths: selectedPack.durationMonths,
        }),
      })

      const data = await response.json()
      console.log('[v0] Payment response:', { status: response.status, data })

      if (!response.ok) {
        console.error('[v0] Payment submission failed:', data)
        setUploadError(data.error || 'Failed to submit payment. Please try again.')
        return
      }

      console.log('[v0] Payment submitted successfully:', data)
      
      // Clear selected pack from localStorage
      localStorage.removeItem('salonjobsindia_selected_credit_pack')
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('[v0] Error submitting payment:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error submitting payment. Please try again.'
      setUploadError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedPack) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${isVerifiedBadge ? 'bg-blue-500/20' : 'bg-primary/20'} flex items-center justify-center`}>
            {isVerifiedBadge ? (
              <BadgeCheck className="w-10 h-10 text-blue-400" />
            ) : (
              <Clock className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-3">Payment Under Review</h1>
          <p className="text-muted-foreground mb-6">
            {isVerifiedBadge ? (
              <>Your payment for <span className="text-blue-400 font-semibold">{selectedPack.durationMonths} month{(selectedPack.durationMonths || 1) > 1 ? 's' : ''} Verified Badge</span> is being verified. Badge will be activated within 24 hours.</>
            ) : (
              <>Your payment for <span className="text-primary font-semibold">{selectedPack.credits} credits</span> is being verified. Credits will be added to your account within 24 hours.</>
            )}
          </p>
          
          <div className="p-4 glass-card rounded-xl mb-6 text-left">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Our team verifies your payment screenshot</li>
              {isVerifiedBadge ? (
                <>
                  <li>2. Verified badge is activated on your profile</li>
                  <li>3. Badge appears on all your job posts</li>
                </>
              ) : (
                <>
                  <li>2. {selectedPack.credits} credits are added to your account</li>
                  <li>3. You receive a notification once approved</li>
                </>
              )}
            </ul>
          </div>
          
          <Button onClick={() => goToStep('owner-panel')} className="w-full bg-primary hover:bg-primary/90">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass flex items-center gap-3">
        <button onClick={() => goToStep('owner-panel')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{isVerifiedBadge ? 'Get Verified Badge' : 'Buy Credits'}</h1>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        {/* Selected Pack Info */}
        <div className={`p-5 glass-card rounded-2xl mb-6 ${isVerifiedBadge ? 'border-2 border-blue-500/30' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isVerifiedBadge && (
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-blue-400" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{selectedPack.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {isVerifiedBadge 
                    ? `${selectedPack.durationMonths} month${(selectedPack.durationMonths || 1) > 1 ? 's' : ''} validity`
                    : `${selectedPack.credits} contact credits`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isVerifiedBadge ? 'text-blue-400' : 'text-primary'}`}>Rs.{selectedPack.price}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {selectedPack.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className={`w-4 h-4 ${isVerifiedBadge ? 'text-blue-400' : 'text-primary'}`} />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Payment Instructions */}
        <div className="p-5 glass-card rounded-2xl mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Payment Instructions
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">1</span>
              <p className="text-muted-foreground">
                Pay <span className="text-primary font-semibold">Rs.{selectedPack.price}</span> to the UPI ID below
              </p>
            </div>
            
            {/* UPI ID */}
            <div className="p-3 bg-secondary/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
              <p className="font-mono font-semibold">{PAYMENT_CONFIG.upiId}</p>
            </div>
            
            {/* QR Code Image */}
            <div className="p-4 bg-white rounded-xl flex items-center justify-center">
              <img 
                src="/images/payment-qr.jpg" 
                alt="UPI QR Code" 
                className="w-40 h-40 object-cover rounded-lg"
              />
            </div>
            
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">2</span>
              <p className="text-muted-foreground">Take a screenshot of successful payment</p>
            </div>
            
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">3</span>
              <p className="text-muted-foreground">Upload the screenshot below for verification</p>
            </div>
          </div>
        </div>
        
        {/* Screenshot Upload */}
        <div className="p-5 glass-card rounded-2xl mb-6">
          <h3 className="font-semibold mb-4">Upload Payment Screenshot</h3>
          
          {uploadError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">{uploadError}</span>
            </div>
          )}
          
          {screenshotPreview ? (
            <div className="relative">
              <img 
                src={screenshotPreview} 
                alt="Payment screenshot" 
                className="w-full rounded-xl border border-border/50"
              />
              {!isUploading && (
                <button
                  onClick={() => {
                    setScreenshotFile(null)
                    setScreenshotPreview(null)
                    setUploadError(null)
                  }}
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <span className="text-xs font-medium">Change</span>
                </button>
              )}
            </div>
          ) : (
            <label className={`block cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="p-8 border-2 border-dashed border-border/50 rounded-xl text-center hover:border-primary/50 transition-colors">
                {isUploading ? (
                  <>
                    <Loader className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground mb-1">Uploading screenshot...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Tap to upload screenshot</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        {/* Support */}
        <div className="p-4 glass-card rounded-xl mb-6">
          <p className="text-sm text-muted-foreground text-center">
            Need help? Call us at{' '}
            <a href={`tel:${PAYMENT_CONFIG.supportPhone}`} className="text-primary font-medium">
              {PAYMENT_CONFIG.supportPhone}
            </a>
          </p>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="relative z-10 p-4 glass">
        <Button
          onClick={handleSubmit}
          disabled={!screenshotFile || isSubmitting}
          className="w-full h-14 bg-primary hover:bg-primary/90 gold-glow"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Submit Payment for Verification
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
