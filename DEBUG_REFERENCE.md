# Debug Statements Reference

All debug logging uses the `[v0]` prefix for easy filtering. Use these to trace execution in production:

## Search Pattern
```bash
# Find all debug statements
grep -r "\[v0\]" /vercel/share/v0-project/

# Follow logs in production
tail -f logs.txt | grep "\[v0\]"
```

---

## Debug Points by Feature

### Job Creation & Payment Workflow
```javascript
// app/api/jobs/route.ts
console.log('[v0] Job created with pending_payment status:', result.insertedId)

// lib/data-store.ts - approveJobPayment()
console.log('[v0] Job payment approved, job now live:', job.id)

// lib/data-store.ts - rejectJobPayment()
console.log('[v0] Job payment rejected, job reverted to draft:', job.id)
```

### Job Seeker Payment & Visibility
```javascript
// lib/data-store.ts - approveJobSeekerPayment()
console.log('[v0] Job Seeker subscription approved:', subscription.userId)

// lib/data-store.ts - rejectJobSeekerPayment()
console.log('[v0] Job Seeker payment rejected:', payment.userId)
```

### Credits System
```javascript
// lib/data-store.ts - deductContactCredit()
console.log('[v0] Credit deducted. Remaining:', profile.contactCredits)

// lib/data-store.ts - buyCreditPack()
console.log('[v0] Credit pack purchase created, awaiting admin approval:', payment.id)

// lib/data-store.ts - approveCreditPurchasePayment()
console.log('[v0] Duplicate payment detected, rejecting')
console.log('[v0] Credit purchase approved, credits added:', creditsAdded)
```

### Location Detection
```javascript
// lib/hooks/use-location-detection.ts
console.log('[v0] Starting location detection...')
console.log('[v0] Location detected successfully:', detectedLocation.address)
console.error('[v0] Location detection failed:', errorMessage)

// lib/location-utils.ts
console.error('[v0] Reverse geocoding failed:', error)
```

### Payment Approval (API)
```javascript
// app/api/payments/approve/route.ts
console.log('[v0] Admin approve payment: ${paymentId}')
console.log('[v0] Job made live after payment approval:', payment.jobId)
console.log('[v0] Job reverted to draft after payment rejection:', payment.jobId)
```

### Applications
```javascript
// app/api/applications/route.ts
console.log('[v0] Application created successfully:', result.insertedId)
console.log('[v0] Application status updated:', applicationId)
```

### Payment API
```javascript
// app/api/payments/route.ts
console.log('[v0] Fetching payments:', { status, type })
console.log('[v0] Creating payment record:', { userId, type, amount })
console.log(`[v0] Admin ${action}ing payment:`, { paymentId, adminId, reason })
```

---

## Trace a User Transaction

### Salon Owner Posts Job:
1. `[v0] Job created with pending_payment status` - Job created
2. Look for payment creation log (in data-store)
3. `[v0] Admin approve payment` - Admin reviews payment
4. `[v0] Job made live after payment approval` - Job goes live

### Job Seeker Subscribes:
1. Payment creation log
2. `[v0] Admin approve payment` - Admin reviews subscription payment
3. `[v0] Job Seeker subscription approved` - Profile becomes visible

### Credit Purchase:
1. `[v0] Credit pack purchase created` - Purchase requested
2. `[v0] Admin approve payment` - Admin reviews credit purchase
3. `[v0] Credit purchase approved, credits added` - Credits added to account

### Location Detection:
1. `[v0] Starting location detection` - User clicks auto-detect
2. `[v0] Location detected successfully` or `[v0] Location detection failed` - Success/error
3. Check browser localStorage for cached location

---

## Error Tracing

### Payment Issues:
```
grep "[v0] Admin approve payment" - Find approval events
grep "[v0] Job payment rejected" - Find rejections
grep "[v0] Duplicate payment detected" - Find fraud attempts
```

### Location Issues:
```
grep "[v0] Location detection failed" - Find location errors
grep "[v0] Reverse geocoding failed" - Find geocoding issues
```

### Application Issues:
```
grep "[v0] Application created" - Find successful applications
grep "Cannot apply to this job" - Find blocked applications
```

---

## Monitoring Tips

### Set up log aggregation to watch for:
- `[v0] Job created with pending_payment` - Should be frequent
- `[v0] Admin approve payment` - Should happen regularly
- Any `[v0]` error messages - Indicates problems

### Dashboard Queries:
```javascript
// All successful jobs going live
SELECT * FROM logs WHERE message LIKE '[v0] Job made live%'

// Failed payments
SELECT * FROM logs WHERE message LIKE '[v0] Job payment rejected%'

// Credit system errors
SELECT * FROM logs WHERE message LIKE '[v0] Duplicate payment detected%'

// Location failures
SELECT * FROM logs WHERE message LIKE '[v0] Location detection failed%'
```

---

## Removing Debug Logs

When ready for production cleanup, search for and remove:
```bash
grep -n "\[v0\]" file.ts
# Then use Edit tool to remove matching lines
```

**DO NOT remove in current version** - These logs are essential for debugging in production.
