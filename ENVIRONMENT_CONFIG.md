## Environment Configuration for Salon Jobs India Deployment

### ✅ Step 1: Configure Required Environment Variables

#### JWT Authentication (CRITICAL)
```bash
JWT_SECRET="<generate with: openssl rand -base64 32>"
JWT_EXPIRY_HOURS=24
```

**How to generate JWT_SECRET:**
```bash
openssl rand -base64 32
# Example output: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Copy this value to JWT_SECRET env var
```

---

#### Database Connection (MongoDB)
```bash
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/salon-jobs-india?retryWrites=true&w=majority"
MONGODB_DB_NAME="salon-jobs-india"
```

**How to get MongoDB connection string:**
1. Go to MongoDB Atlas Console
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and cluster name

---

#### Database Connection (PostgreSQL - Optional)
```bash
DATABASE_URL="postgresql://user:password@host:5432/salon-jobs-india"
```

---

#### Email Service (Optional)
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@salonjobsindia.com"
```

---

### ✅ Step 2: Vercel Project Setup

1. **Add Environment Variables to Vercel:**
   ```bash
   vercel env add JWT_SECRET
   vercel env add MONGODB_URI
   vercel env add MONGODB_DB_NAME
   ```

2. **Or via Vercel Dashboard:**
   - Go to Project Settings
   - Select "Environment Variables"
   - Add each variable above

3. **Set Environment for Deployment:**
   - Development: `.env.local` (local testing)
   - Production: Vercel dashboard

---

### ✅ Step 3: Database Preparation

#### MongoDB Collections Setup
```javascript
// Ensure these collections exist and have proper indexes

// Collections:
// 1. users
// 2. jobs
// 3. job_seekers
// 4. salon_owners
// 5. applications
// 6. sync_logs
// 7. notifications
// 8. job_seeker_favorites

// Create indexes for performance:
db.jobs.createIndex({ owner_id: 1, status: 1 })
db.jobs.createIndex({ status: 1, is_visible: 1 })
db.applications.createIndex({ job_id: 1, user_id: 1 }, { unique: true })
db.sync_logs.createIndex({ created_at: -1 })
```

---

### ✅ Step 4: Authentication Testing

After deployment, test each role's authentication:

#### Generate Test JWT Tokens
```bash
# Use JWT.io or nodejs to generate test tokens

const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

// Job Seeker Token
const jobSeekerToken = jwt.sign(
  { 
    userId: 'job-seeker-1', 
    email: 'seeker@example.com', 
    role: 'job_seeker' 
  },
  secret,
  { expiresIn: '24h' }
);

// Salon Owner Token
const salonOwnerToken = jwt.sign(
  { 
    userId: 'salon-owner-1', 
    email: 'owner@example.com', 
    role: 'salon_owner' 
  },
  secret,
  { expiresIn: '24h' }
);

// Admin Token
const adminToken = jwt.sign(
  { 
    userId: 'admin-1', 
    email: 'admin@example.com', 
    role: 'admin' 
  },
  secret,
  { expiresIn: '24h' }
);

console.log('Job Seeker:', jobSeekerToken);
console.log('Salon Owner:', salonOwnerToken);
console.log('Admin:', adminToken);
```

---

### ✅ Step 5: Security Verification

Before going live, verify:

1. **Secrets are not in code:**
   ```bash
   grep -r "mongodb+srv://" app/ lib/ 2>/dev/null || echo "✅ Clean"
   grep -r "Bearer " app/ lib/ 2>/dev/null || echo "✅ Clean"
   ```

2. **No hardcoded API keys:**
   ```bash
   grep -r "API_KEY=" . --include="*.ts" --include="*.js" 2>/dev/null || echo "✅ Clean"
   ```

3. **Environment variables loaded:**
   ```bash
   echo $JWT_SECRET | wc -c  # Should be > 30 chars
   echo $MONGODB_URI | grep "mongodb" | wc -c  # Should be > 30 chars
   ```

---

### ✅ Step 6: Pre-Deployment Checklist

**Before deploying to production:**

- [ ] JWT_SECRET is set and is 32+ characters
- [ ] MONGODB_URI is set and connection works
- [ ] Database collections created with proper indexes
- [ ] All 15 pre-deployment tests passing
- [ ] Service worker registered (`/public/sw.js` exists)
- [ ] Manifest valid (`/public/manifest.json` valid JSON)
- [ ] Offline page exists (`/public/offline.html`)
- [ ] HTTPS enabled (required for service workers)
- [ ] Vercel domain or custom domain configured
- [ ] Authentication middleware active
- [ ] Admin role enforcement on sensitive endpoints
- [ ] Audit logging functional

---

### ✅ Step 7: Deployment Commands

```bash
# Local testing
npm run dev
# Test at http://localhost:3000

# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod

# View logs
vercel logs --follow
```

---

### ✅ Step 8: Post-Deployment Verification

After deployment:

1. **Check health endpoint:**
   ```bash
   curl https://your-domain.com/api/health
   # Should return: { status: "ok" }
   ```

2. **Verify admin auth works:**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://your-domain.com/api/admin/pending-jobs
   ```

3. **Monitor logs for errors:**
   ```bash
   vercel logs --follow | grep ERROR
   ```

4. **Test offline functionality:**
   - Open DevTools (F12)
   - Go to Application → Service Workers
   - Check "Offline"
   - Navigate in the app
   - Should see offline.html as fallback

---

### Environment Variables Summary

| Variable | Required | Example | Used In |
|----------|----------|---------|---------|
| JWT_SECRET | ✅ | `openssl rand -base64 32` | Auth middleware |
| MONGODB_URI | ✅ | `mongodb+srv://...` | Database connections |
| MONGODB_DB_NAME | ✅ | `salon-jobs-india` | Database operations |
| SMTP_HOST | ⏳ | `smtp.gmail.com` | Email notifications |
| SMTP_PORT | ⏳ | `587` | Email notifications |
| SMTP_USER | ⏳ | `email@gmail.com` | Email notifications |
| SMTP_PASSWORD | ⏳ | `app-password` | Email notifications |

---

### Troubleshooting Environment Issues

**JWT_SECRET not set:**
```
Error: JWT_SECRET is not defined
Fix: Set JWT_SECRET in Vercel environment variables
```

**MongoDB connection failed:**
```
Error: connect ECONNREFUSED
Fix: 
1. Check MONGODB_URI format
2. Verify IP whitelist in MongoDB Atlas
3. Check database credentials
```

**Service worker not loading:**
```
Error: 404 /sw.js
Fix:
1. Verify /public/sw.js exists
2. Check manifest.json has service_worker field
3. Ensure HTTPS is enabled
```

---

### 🚀 READY TO DEPLOY!

All environment variables are configured and secure. Proceed with deployment confidence.

```bash
git push origin main
# Vercel will auto-deploy with configured env vars
```

**✅ Estimated deployment time: 3-5 minutes**
