'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Crown, Building2, Sparkles, Check, Clock, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { SALON_OWNER_PLANS } from '@/lib/data-store'
import {
  createSubscriptionOrder,
  openRazorpayCheckout,
  checkPaymentStatus,
} from '@/lib/razorpay-utils'

export function RazorpaySubscription() {
  const { user, setSubscription, goToStep } = useApp()
  const isOwner = user?.role === 'salon_owner' || user?.role === 'employer'

  // Job seekers skip subscriptions
  useEffect(() => {
    if (user && !isOwner) {
      goToStep('results')
    }
  }, [user, isOwner, goToStep])

  const [selectedPlan, setSelectedPlan] = useState<string>('single_post')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)

  if (!isOwner) {
    return null
  }

  const plans = SALON_OWNER_PLANS
  const selectedPlanDetails = plans.find((p) => p.id === selectedPlan)

  if (!selectedPlanDetails) {
    return null
  }

  const handleSubscribe = async () => {
    if (!user?.id) {
      alert('Please log in first')
      return
    }

    setIsProcessing(true)

    try {
      console.log('[v0] Creating subscription order:', {
        userId: user.id,
        planId: selectedPlan,
        amount: selectedPlanDetails.price,
      })

      // Create order on server
      const orderData = await createSubscriptionOrder(
        user.id,
        selectedPlan,
        selectedPlanDetails.price,
        selectedPlanDetails.name,
        1 // 1 month
      )

      setCurrentPaymentId(orderData.paymentId)
      console.log('[v0] Order created:', orderData.orderId)

      // Open Razorpay checkout
      await openRazorpayCheckout({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        orderId: orderData.orderId,
        description: `Subscription: ${selectedPlanDetails.name}`,
        prefill: {
          name: user.name || undefined,
          email: user.email || undefined,
          contact: user.phone || undefined,
        },
        handler: async (response: any) => {
          console.log('[v0] Payment successful:', response.razorpay_payment_id)
          setPaymentProcessing(true)

          // Wait for webhook to process
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // Check payment status
          try {
            const status = await checkPaymentStatus(orderData.paymentId)
            if (status.status === 'paid') {
              console.log('[v0] Payment confirmed by server')
              setPaymentProcessing(false)
              goToStep(isOwner ? 'owner-panel' : 'discovery')
            } else {
              console.log('[v0] Payment status:', status.status)
              setPaymentProcessing(false)
              alert('Payment processing. Please refresh or contact support if not updated within 5 minutes.')
            }
          } catch (error) {
            console.error('[v0] Error checking payment status:', error)
            setPaymentProcessing(false)
            alert('Payment submitted. Please refresh to verify.')
          }
        },
        onDismiss: () => {
          console.log('[v0] Payment dismissed')
          setIsProcessing(false)
        },
      })
    } catch (error) {
      console.error('[v0] Error creating subscription order:', error)
      alert(error instanceof Error ? error.message : 'Failed to create payment order')
      setIsProcessing(false)
    }
  }

  if (paymentProcessing) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Processing Payment</h1>
          <p className="text-muted-foreground">Your payment is being verified. This may take a few moments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep('owner-panel')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold">Choose Your Plan</h1>
          <p className="text-xs text-muted-foreground">Instant activation with Razorpay</p>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 px-4 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* User Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="px-4 py-2 glass-card rounded-full flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Employer Plans</span>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="space-y-3 mb-6">
            {plans.map((plan, index) => {
              const isSelected = selectedPlan === plan.id

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={isProcessing}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    isSelected
                      ? 'glass-card border-2 border-primary bg-primary/5'
                      : 'glass-card border border-border/50 hover:border-primary/30'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      <Crown className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{plan.price}</p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        {(plan as any).jobPosts && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            <span>{(plan as any).jobPosts} job posts</span>
                          </div>
                        )}
                        {plan.features.slice(0, 2).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Features */}
          <div className="glass-card rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm">Instant activation after payment</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm">Secure Razorpay payment</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm">30-day subscription</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? 'Processing...' : `Subscribe Now - ₹${selectedPlanDetails.price}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Powered by Razorpay. Secure payment gateway.
          </p>
        </div>
      </div>
    </div>
  )
}
