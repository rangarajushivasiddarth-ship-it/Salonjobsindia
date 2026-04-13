'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, QrCode, Upload, Check, Clock, Shield, MapPin, Phone, FileText, X, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import type { Subscription } from '@/lib/types'

export function SubscriptionScreen() {
  const { user, setSubscription, goToStep } = useApp()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!uploadedFile) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId: user?.id || '',
      screenshotUrl: previewUrl || '',
      status: 'pending',
      createdAt: new Date(),
    }
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // In production, this would be set after admin approval
    // For demo, we'll auto-approve after a delay
    setTimeout(() => {
      setSubscription({
        ...subscription,
        status: 'approved',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
    }, 2000)
  }

  const benefits = [
    { icon: MapPin, text: 'View salons within 20km radius' },
    { icon: Phone, text: 'Access contact information' },
    { icon: FileText, text: 'See full job descriptions' },
    { icon: Shield, text: '30 days unlimited access' },
  ]

  if (isSubmitted) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        
        <div className="relative z-10 text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 gold-glow">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Payment Submitted!</h1>
          <p className="text-muted-foreground mb-2">Your payment is being verified</p>
          <p className="text-sm text-muted-foreground mb-8">
            You&apos;ll get access once approved by admin
          </p>
          
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="w-5 h-5 animate-pulse" />
            <span>Verification in progress...</span>
          </div>
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
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Unlock Premium Access</h1>
            <p className="text-muted-foreground">Get full access to all salon details</p>
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-4 glass-card rounded-xl animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
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
            
            {/* QR Code Placeholder */}
            <div className="w-full aspect-square max-w-[200px] mx-auto bg-foreground rounded-xl flex items-center justify-center mb-4">
              <div className="text-background text-center p-4">
                <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-xs opacity-70">QR Code will appear here</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary mb-1">₹99</p>
              <p className="text-xs text-muted-foreground">One-time payment for 30 days</p>
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
                <Image className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
              </button>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Scan the QR code and complete payment</p>
              <p>2. Take a screenshot of the payment confirmation</p>
              <p>3. Upload the screenshot above</p>
              <p>4. Wait for admin approval (usually within 1 hour)</p>
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
