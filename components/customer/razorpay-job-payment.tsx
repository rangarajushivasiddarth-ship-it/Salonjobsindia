'use client'

import { useState } from 'react'
import { Loader, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createJobPostingOrder, openRazorpayCheckout, checkPaymentStatus } from '@/lib/razorpay-utils'

interface RazorpayJobPaymentProps {
  jobId: string
  userId: string
  userName?: string
  userEmail?: string
  userPhone?: string
  onPaymentSuccess?: () => void
  onCancel?: () => void
}

export function RazorpayJobPayment({
  jobId,
  userId,
  userName,
  userEmail,
  userPhone,
  onPaymentSuccess,
  onCancel,
}: RazorpayJobPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const JOB_POSTING_AMOUNT = 149 // Fixed amount

  const handlePayNow = async () => {
    if (!userId) {
      setError('Please log in first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log('[v0] Creating job posting order')

      // Create order
      const orderData = await createJobPostingOrder(userId, jobId)
      setPaymentId(orderData.paymentId)

      // Open checkout
      await openRazorpayCheckout({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        orderId: orderData.orderId,
        description: `Job Posting Payment - ₹${orderData.amount}`,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        handler: async (response: any) => {
          console.log('[v0] Payment successful:', response.razorpay_payment_id)

          // Wait for webhook
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // Verify
          try {
            const status = await checkPaymentStatus(orderData.paymentId)
            if (status.status === 'paid') {
              console.log('[v0] Job payment confirmed')
              if (onPaymentSuccess) {
                onPaymentSuccess()
              }
            } else {
              setError('Payment is still processing. Your job will go live shortly.')
            }
          } catch (err) {
            console.error('[v0] Error checking job payment:', err)
            setError('Payment submitted. Job will be activated within 5 minutes.')
          }
        },
        onDismiss: () => {
          setIsProcessing(false)
        },
      })
    } catch (err) {
      console.error('[v0] Job payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setIsProcessing(false)
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="glass-card rounded-2xl max-w-sm w-full p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Payment Error</h3>
          </div>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setError(null)} className="flex-1">
              Dismiss
            </Button>
            <Button onClick={handlePayNow} className="flex-1">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-sm w-full p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Post Your Job</h2>
          <p className="text-muted-foreground">₹{JOB_POSTING_AMOUNT} per job posting</p>
        </div>

        <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Posting Fee</span>
            <span className="font-semibold">₹{JOB_POSTING_AMOUNT}</span>
          </div>
          <div className="border-t border-border/30 pt-3 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg text-primary">₹{JOB_POSTING_AMOUNT}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Your job will be live immediately after payment
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Secure Razorpay payment
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Visible to all job seekers
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayNow}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processing...' : `Pay ₹${JOB_POSTING_AMOUNT}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
