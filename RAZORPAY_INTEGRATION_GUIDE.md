# Razorpay Integration Guide

## Setup Steps

### 1. Add Environment Variables

Add these to your `.env.local`:

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 2. Razorpay Dashboard Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings > API Keys > Generate Key Pair
3. Copy Key ID and Key Secret to env variables
4. Go to Settings > Webhooks
5. Add webhook endpoint: `https://yourdomain.com/api/webhooks/razorpay`
6. Select events: `payment.captured`, `order.paid`, `payment.failed`
7. Copy Webhook Secret to env variables

### 3. Database Schema Updates

The payments table needs these new columns:
- `razorpay_order_id` (text) - Razorpay order ID
- `razorpay_payment_id` (text) - Razorpay payment ID  
- `paid_at` (timestamp) - When payment was completed
- `expires_at` (timestamp) - Subscription expiry
- `job_id` (uuid) - For job postings

The system also needs a `salon_subscriptions` table:
- `user_id` (uuid) - Salon owner ID
- `subscription_status` (text) - 'active', 'expired', 'cancelled'
- `subscription_expiry` (timestamp) - When subscription expires
- `verification_badge` (boolean) - If verified
- `last_payment_id` (uuid) - Latest payment

## Payment Flow

### Subscription Payment
1. User clicks "Subscribe Now" on plan
2. Frontend calls `/api/payments/create-subscription-order`
3. Server creates Razorpay order and payment record
4. Frontend opens Razorpay Checkout modal
5. User completes payment
6. Razorpay webhook calls `/api/webhooks/razorpay`
7. Server verifies signature and marks payment as paid
8. Subscription activated: `subscription_status = 'active'`
9. Verification badge enabled
10. Job postings become available

### Job Posting Payment
1. User must have active subscription
2. User clicks "Pay ₹149" to post job
3. Frontend calls `/api/payments/create-job-order`
4. Server creates Razorpay order
5. Frontend opens Razorpay Checkout
6. User completes payment
7. Webhook verifies and marks payment as paid
8. Job automatically set to `status='live'`
9. Job visible to job seekers immediately

## Admin Dashboard

Admins can:
- View all Razorpay payments with status
- See subscription and job payments separately
- Remove fake jobs manually (jobs are auto-live after payment, not pending)
- Disable salon owner if needed

No payment approval needed - all automatic via webhook.

## Components to Use

### Subscription Flow
```tsx
import { RazorpaySubscription } from '@/components/customer/razorpay-subscription'

// In your subscription screen:
<RazorpaySubscription />
```

### Job Payment Flow
```tsx
import { RazorpayJobPayment } from '@/components/customer/razorpay-job-payment'

// When user wants to post job:
<RazorpayJobPayment
  jobId={jobId}
  userId={userId}
  userName={userName}
  userEmail={userEmail}
  userPhone={userPhone}
  onPaymentSuccess={() => {
    // Redirect or reload
  }}
/>
```

## Testing

### Test Mode
Use Razorpay test keys in development. Payment will go through test mode.

### Test Cards
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1112

### Test Webhook
Use Razorpay's webhook testing tool in dashboard.

## Security Notes

- Razorpay secret key is only used server-side
- Webhook verifies signature before processing
- No frontend payment verification
- Supabase service role key used for database updates
- RLS policies ensure data isolation

## API Endpoints

### Create Subscription Order
```
POST /api/payments/create-subscription-order
{
  userId: string
  planId: string
  amount: number
  planName: string
  durationMonths?: number
}

Response:
{
  orderId: string
  amount: number
  currency: 'INR'
  keyId: string
  paymentId: string
}
```

### Create Job Order
```
POST /api/payments/create-job-order
{
  userId: string
  jobId: string
}

Response:
{
  orderId: string
  amount: 149
  currency: 'INR'
  keyId: string
  paymentId: string
}
```

### Webhook Handler
```
POST /api/webhooks/razorpay
Headers: x-razorpay-signature: signature
Body: webhook event JSON
```

### Check Payment Status
```
GET /api/payments/{paymentId}

Response:
{
  status: 'created' | 'paid' | 'failed'
  razorpayPaymentId?: string
  paidAt?: string
}
```

### Admin View Payments
```
GET /api/admin/razorpay-payments?status=paid&type=subscription&limit=50
```

## Removing Old Payment System

Old components to remove:
- `components/customer/credit-payment.tsx` (screenshot-based)
- `components/customer/subscription-screen.tsx` (old manual flow)
- Screenshot upload endpoints
- Manual admin approval endpoints

Keep these for optional fallback later if needed.
