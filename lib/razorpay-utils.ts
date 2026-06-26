// Razorpay utilities for client-side payment handling

declare global {
  interface Window {
    Razorpay: any
  }
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  orderId: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  handler?: (response: any) => void
  onDismiss?: () => void
}

export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const scriptLoaded = await loadRazorpayScript()
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script')
  }

  const razorpay = new window.Razorpay({
    key: options.key,
    amount: Math.round(options.amount * 100), // Convert to paise
    currency: options.currency,
    order_id: options.orderId,
    description: options.description || 'Payment',
    prefill: options.prefill || {},
    handler: (response: any) => {
      if (options.handler) {
        options.handler(response)
      }
    },
  })

  razorpay.on('dismiss', () => {
    if (options.onDismiss) {
      options.onDismiss()
    }
  })

  razorpay.open()
}

export async function createSubscriptionOrder(
  userId: string,
  planId: string,
  amount: number,
  planName: string,
  durationMonths?: number
) {
  const response = await fetch('/api/payments/create-subscription-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      planId,
      amount,
      planName,
      durationMonths: durationMonths || 1,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create order')
  }

  return await response.json()
}

export async function createJobPostingOrder(userId: string, jobId: string) {
  const response = await fetch('/api/payments/create-job-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, jobId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create order')
  }

  return await response.json()
}

export async function checkPaymentStatus(paymentId: string): Promise<{
  status: string
  razorpayPaymentId?: string
  paidAt?: string
}> {
  const response = await fetch(`/api/payments/${paymentId}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch payment status')
  }

  return await response.json()
}
