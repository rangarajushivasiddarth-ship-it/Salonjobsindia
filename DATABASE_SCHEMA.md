# Salon Jobs India - Database Schema & Indices

## MongoDB Collections

### 1. users
```typescript
{
  _id: ObjectId
  email: string (unique)
  phone: string (unique)
  name?: string
  role: 'job_seeker' | 'salon_owner' | 'employer'
  isSubscribed: boolean
  subscriptionId?: ObjectId (FK to subscriptions)
  profilePhoto?: string
  identityProof?: {
    type: string
    verified: boolean
  }
  createdAt: Date
}
```

**Indices:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ subscriptionId: 1 })
db.users.createIndex({ createdAt: -1 })
```

---

### 2. jobs
```typescript
{
  _id: ObjectId
  salonId: ObjectId (FK to salon_profiles)
  salonName: string
  salonLogo?: string
  salonMobile: string
  role: string
  customRole?: string
  skills: string[]
  customSkills?: string[]
  salaryType: 'fixed' | 'range'
  salaryFixed?: string
  salaryRange?: string
  experience: string
  jobType: 'full_time' | 'part_time'
  description: string
  location: {
    lat: number
    lng: number
    address: string
    state: string
    city: string
    area: string
    locality: string
  }
  contact: string
  status: 'draft' | 'pending_payment' | 'pending_admin_approval' | 'live' | 'expired' | 'rejected'
  editsUsed: number
  maxEdits: number
  viewsCount: number
  applicationsCount: number
  isVerified: boolean
  paymentId: string (FK to payments) - REQUIRED when status === 'live'
  salonSubscriptionId?: ObjectId (FK to subscriptions)
  paymentSubmittedAt?: Date
  paymentApprovedAt?: Date
  createdAt: Date
  expiresAt: Date - REQUIRED (checked for auto-expiration)
  isActive: boolean (derived from status === 'live' && expiresAt > now())
}
```

**Indices (CRITICAL):**
```javascript
db.jobs.createIndex({ status: 1 })                           // Filter by status
db.jobs.createIndex({ salonId: 1 })                          // Filter by owner
db.jobs.createIndex({ expiresAt: 1 })                        // Expiration queries
db.jobs.createIndex({ createdAt: -1 })                       // Sort by newest
db.jobs.createIndex({ paymentId: 1 })                        // Link to payment
db.jobs.createIndex({ status: 1, expiresAt: 1 })            // Live & active jobs
db.jobs.createIndex({ 'location.state': 1, status: 1 })     // Location-based search
db.jobs.createIndex({ role: 'text' })                        // Text search on roles
```

---

### 3. salon_profiles
```typescript
{
  _id: ObjectId
  ownerId: ObjectId (FK to users)
  salonName: string
  ownerName: string
  mobile: string
  email?: string
  logoUrl?: string
  address: string
  latitude: number
  longitude: number
  state: string
  city: string
  district?: string
  country?: string
  area: string
  locality: string
  workingHours: string
  description?: string
  isVerified: boolean
  verifiedUntil?: Date
  contactCredits: number
  unlockedCandidates: ObjectId[] (IDs of candidates they unlocked)
  createdAt: Date
  updatedAt: Date
}
```

**Indices:**
```javascript
db.salon_profiles.createIndex({ ownerId: 1 }, { unique: true })
db.salon_profiles.createIndex({ salonName: 1 })
db.salon_profiles.createIndex({ city: 1, state: 1 })
db.salon_profiles.createIndex({ createdAt: -1 })
db.salon_profiles.createIndex({ verifiedUntil: 1 })
```

---

### 4. resumes (Job Seeker Profiles)
```typescript
{
  _id: ObjectId
  userId: ObjectId (FK to users) - UNIQUE
  name: string
  dateOfBirth: string
  role: string
  experience: string
  skills: string[]
  salaryExpectation: string
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    district?: string
    state?: string
    country?: string
  }
  passportPhoto?: {
    url?: string
    uploaded: boolean
  }
  identityProof?: {
    type: 'Aadhar Card' | 'PAN Card' | 'Driving License' | 'Other'
    documentUrl?: string
    uploaded: boolean
    verified: boolean
  }
  videoIntro?: string
  isActive?: boolean
  availabilityStatus?: 'actively_looking' | 'open_to_opportunities' | 'not_looking'
  jobPreference?: 'looking_for_work' | 'not_looking_for_job'
  visibilityStatus?: 'incomplete_profile' | 'active_visible' | 'hidden' | 'rejected'
  createdAt: Date
  updatedAt: Date
}
```

**Indices:**
```javascript
db.resumes.createIndex({ userId: 1 }, { unique: true })
db.resumes.createIndex({ role: 1 })
db.resumes.createIndex({ 'location.state': 1, 'location.city': 1 })
db.resumes.createIndex({ isActive: 1, visibilityStatus: 1 })
db.resumes.createIndex({ createdAt: -1 })
db.resumes.createIndex({ skills: 1 })
```

---

### 5. payments
```typescript
{
  _id: ObjectId
  userId: ObjectId (FK to users)
  userName?: string
  userPhone?: string
  salonName?: string
  type: 'job_publishing' | 'verified_badge_1m' | 'verified_badge_3m' | 'contact_pack_10' | 'contact_pack_50'
  planId: string
  amount: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  jobId?: ObjectId (FK to jobs) - For job publishing payments
  contactCredits?: number
  validityDays: number
  transactionId?: string
  submittedAt: Date
  processedAt?: Date
  processedBy?: string (admin userId)
  rejectionReason?: string
}
```

**Indices:**
```javascript
db.payments.createIndex({ userId: 1 })                      // User's payments
db.payments.createIndex({ status: 1 })                      // Filter by status
db.payments.createIndex({ type: 1 })                        // Filter by type
db.payments.createIndex({ jobId: 1 })                       // Link to job
db.payments.createIndex({ submittedAt: -1 })               // Sort by newest
db.payments.createIndex({ status: 1, type: 1 })           // Pending job payments
db.payments.createIndex({ transactionId: 1 })              // Duplicate prevention
```

---

### 6. subscriptions
```typescript
{
  _id: ObjectId
  userId: ObjectId (FK to users) - UNIQUE per salon owner
  userPhone?: string
  userName?: string
  userRole: 'salon_owner'
  planType: 'job_publishing' | 'verified_badge_1m' | 'verified_badge_3m'
  planName: string
  amount: number
  screenshotUrl?: string
  transactionId?: string
  paymentMethod: 'upi' | 'card' | 'netbanking'
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  jobPostsTotal?: number
  jobPostsUsed?: number
  contactCredits?: number
  createdAt: Date
  approvedAt?: Date
  expiresAt?: Date
}
```

**Indices:**
```javascript
db.subscriptions.createIndex({ userId: 1 }, { unique: true })
db.subscriptions.createIndex({ status: 1 })
db.subscriptions.createIndex({ expiresAt: 1 })              // Check active subscriptions
db.subscriptions.createIndex({ planType: 1 })
db.subscriptions.createIndex({ createdAt: -1 })
db.subscriptions.createIndex({ status: 1, expiresAt: 1 }) // Active subscriptions
```

---

## Migration Steps for Production

### Step 1: Add Indices
```javascript
// Run these in order
db.jobs.createIndex({ status: 1 })
db.jobs.createIndex({ salonId: 1 })
db.jobs.createIndex({ expiresAt: 1 })
db.jobs.createIndex({ createdAt: -1 })
db.jobs.createIndex({ paymentId: 1 })
db.jobs.createIndex({ status: 1, expiresAt: 1 })
db.jobs.createIndex({ 'location.state': 1, status: 1 })

db.payments.createIndex({ userId: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ jobId: 1 })

db.subscriptions.createIndex({ userId: 1 }, { unique: true })
db.subscriptions.createIndex({ status: 1, expiresAt: 1 })
```

### Step 2: Data Cleanup
```javascript
// Find orphaned jobs (with no paymentId when status === 'live')
db.jobs.find({ status: 'live', paymentId: { $in: [null, '', undefined] } }).count()

// Find expired jobs that aren't marked as expired
db.jobs.find({ expiresAt: { $lt: new Date() }, status: 'live' }).count()

// Mark expired jobs
db.jobs.updateMany(
  { expiresAt: { $lt: new Date() }, status: 'live' },
  { $set: { status: 'expired', isActive: false } }
)
```

### Step 3: Verify Data Integrity
```javascript
// Check for duplicate paymentIds
db.jobs.aggregate([
  { $group: { _id: '$paymentId', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for orphaned payments
db.payments.find({
  jobId: { $ne: null },
  jobId: {
    $nin: db.jobs.find({}, { _id: 1 }).map(x => x._id).toArray()
  }
}).count()
```

---

## Performance Tuning

### Query Patterns to Optimize

1. **Get live jobs for job seeker**
```javascript
db.jobs.find({ status: 'live', expiresAt: { $gt: new Date() } }).limit(20)
// Uses index: { status: 1, expiresAt: 1 }
```

2. **Get salon owner's jobs**
```javascript
db.jobs.find({ salonId: ObjectId(...) }).sort({ createdAt: -1 })
// Uses index: { salonId: 1 }, sort by createdAt index
```

3. **Get pending payments**
```javascript
db.payments.find({ status: 'pending', type: 'job_publishing' })
// Uses index: { status: 1, type: 1 }
```

4. **Check if salon subscription is active**
```javascript
db.subscriptions.findOne({ 
  userId: ObjectId(...), 
  status: 'approved', 
  expiresAt: { $gt: new Date() } 
})
// Uses index: { userId: 1 }, { status: 1, expiresAt: 1 }
```

---

## Constraints to Add

### Unique Constraints
- users: email, phone (already done)
- salon_profiles: ownerId
- resumes: userId
- subscriptions: userId (one active subscription per salon owner)

### Foreign Key Validation (Application-level)
- jobs.salonId must exist in salon_profiles
- jobs.paymentId must exist in payments when status === 'live'
- payments.userId must exist in users
- subscriptions.userId must exist in users

### Data Validation
- location.lat must be between -8 and 35 (India bounds)
- location.lng must be between 68 and 97 (India bounds)
- expiresAt must be > createdAt
- paymentId cannot be empty if status === 'live'
