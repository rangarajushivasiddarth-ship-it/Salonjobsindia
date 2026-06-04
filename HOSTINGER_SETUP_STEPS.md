# Complete Hostinger MySQL Setup - Step-by-Step Guide

## Step 1: Get Your Hostinger Database Credentials

### From Hostinger Control Panel:

1. Log in to **Hostinger Dashboard** (hostinger.com)
2. Go to **Hosting** → **Your Domain**
3. Click **Manage** button
4. Go to **Databases** section (usually in left sidebar)
5. Find your database named `u848359456_salonjobsindia`
6. Click on it to view details

### Credentials to Collect:

```
DATABASE_HOST: auth-db1675.hstgr.io
DATABASE_PORT: 3306
DATABASE_NAME: u848359456_salonjobsindia
DATABASE_USER: u848359456_salonjobsindia
DATABASE_PASSWORD: Bhargavi#143
```

**Note:** Save these securely - you'll need them for Vercel environment variables.

---

## Step 2: Set Environment Variables in Vercel

### Via Vercel Dashboard:

1. Go to **vercel.com** and log in
2. Click on your **SalonJobsIndia project**
3. Go to **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button

### Add Each Variable:

**Variable 1:**
- Name: `DATABASE_HOST`
- Value: `auth-db1675.hstgr.io`
- Production: ✓ Check
- Click **Save**

**Variable 2:**
- Name: `DATABASE_PORT`
- Value: `3306`
- Production: ✓ Check
- Click **Save**

**Variable 3:**
- Name: `DATABASE_NAME`
- Value: `u848359456_salonjobsindia`
- Production: ✓ Check
- Click **Save**

**Variable 4:**
- Name: `DATABASE_USER`
- Value: `u848359456_salonjobsindia`
- Production: ✓ Check
- Click **Save**

**Variable 5:**
- Name: `DATABASE_PASSWORD`
- Value: `Bhargavi#143`
- Production: ✓ Check
- Click **Save**

### Verify in Vercel:

After adding all 5 variables, you should see:
```
✓ DATABASE_HOST
✓ DATABASE_PORT
✓ DATABASE_NAME
✓ DATABASE_USER
✓ DATABASE_PASSWORD
```

---

## Step 3: Deploy to Vercel

### Option A: Automatic Deployment (Recommended)

1. Push your latest code to GitHub:
```bash
cd /vercel/share/v0-project
git add .
git commit -m "Deploy with Hostinger MySQL integration"
git push origin main
```

2. Vercel automatically detects the push and deploys
3. Wait for deployment to complete (usually 1-2 minutes)
4. You'll see a green checkmark when done

### Option B: Manual Deployment

1. Go to **vercel.com** → Your project
2. Click **Deployments** tab
3. Find the latest deployment
4. Click the "..." menu
5. Select **Redeploy**
6. Click **Redeploy** to confirm

---

## Step 4: Initialize Database Tables

### Via API (Recommended):

After deployment completes, call the initialization endpoint:

**Using curl:**
```bash
curl -X POST https://your-salonjobsindia-domain.vercel.app/api/init-db
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "tables_created": 10,
  "timestamp": "2026-06-04T10:30:00Z"
}
```

**Alternative: Using Browser:**
1. Open: `https://your-salonjobsindia-domain.vercel.app/api/init-db?method=POST`
2. Or use Postman:
   - Method: POST
   - URL: `https://your-salonjobsindia-domain.vercel.app/api/init-db`
   - Click Send

### Tables Created:

1. ✓ `users` - All users (job seekers, salon owners, admins)
2. ✓ `jobs` - Job postings
3. ✓ `salon_profiles` - Salon owner details
4. ✓ `applications` - Job applications
5. ✓ `messages` - User messages
6. ✓ `subscriptions` - Subscription records
7. ✓ `notifications` - User notifications
8. ✓ `payments` - Payment transactions
9. ✓ `job_alerts` - Job search alerts
10. ✓ `audit_logs` - Admin action logs

---

## Step 5: Verify Database Connection

### Test Connection Endpoint:

```bash
curl -X GET https://your-salonjobsindia-domain.vercel.app/api/test-db
```

### Expected Response (Success):

```json
{
  "connected": true,
  "message": "Database connection successful",
  "host": "auth-db1675.hstgr.io",
  "database": "u848359456_salonjobsindia",
  "timestamp": "2026-06-04T10:35:00Z"
}
```

### Expected Response (Failure):

```json
{
  "connected": false,
  "error": "Error message details",
  "hint": "Check environment variables"
}
```

---

## Step 6: Upgrade Database (Optional)

### Enable Advanced Features:

After verification, optionally run the Phase 2 upgrade:

```bash
curl -X POST https://your-salonjobsindia-domain.vercel.app/api/phase2-upgrade
```

This adds:
- Database indexes for performance
- Optimized query paths
- Advanced logging

---

## Troubleshooting Guide

### Problem: "Connection refused"

**Cause:** Environment variables not set or incorrect

**Solution:**
1. Go to Vercel Settings → Environment Variables
2. Verify all 5 variables are present
3. Check spelling is exact
4. Redeploy the application
5. Wait 2-3 minutes for variables to take effect

### Problem: "Access denied for user"

**Cause:** Wrong credentials

**Solution:**
1. Double-check Hostinger credentials
2. Verify `DATABASE_USER` matches `DATABASE_NAME` (usually the same)
3. Check password has no special characters issues
4. Test credentials in Hostinger MySQL GUI

### Problem: "Unknown database"

**Cause:** Database name doesn't exist

**Solution:**
1. Create database in Hostinger if missing
2. Check database name is: `u848359456_salonjobsindia`
3. Verify it exists in Hostinger Databases section

### Problem: "Connection timeout"

**Cause:** Network connectivity issue

**Solution:**
1. Check if Hostinger MySQL service is running
2. Verify firewall allows port 3306
3. Try connecting from Hostinger phpMyAdmin first
4. Check internet connection on Vercel side

### Problem: Tables already exist

**Cause:** Init endpoint called multiple times

**Solution:**
- Normal if running init twice
- Already created tables will be skipped
- Safe to call again

---

## Testing the Integration

### 1. Check Data in Hostinger

1. Log in to **Hostinger Dashboard**
2. Go to **Databases**
3. Click **phpMyAdmin**
4. Select your database
5. You should see 10 tables in the left panel

### 2. Insert Test Data

**Using phpMyAdmin:**
1. Select `users` table
2. Click **Insert** tab
3. Add test user:
   - email: `test@example.com`
   - name: `Test User`
   - userType: `job_seeker`
4. Click **Go**

### 3. Query Test Data

```bash
curl "https://your-domain.vercel.app/api/query?table=users&limit=5"
```

---

## Security Best Practices

### 1. Protect Credentials

- ✓ Never commit `.env` files to GitHub
- ✓ Use Vercel Environment Variables (not .env.local)
- ✓ Regularly rotate database password
- ✓ Don't share credentials via email/chat

### 2. Database Security

- ✓ Use strong passwords (already set: `Bhargavi#143`)
- ✓ Restrict database access to Vercel IPs only (in Hostinger)
- ✓ Regular backups enabled in Hostinger
- ✓ Monitor unusual database activity

### 3. Connection Security

- ✓ Use SSL/TLS for connections (enable in Hostinger)
- ✓ Keep connection pool size at 30
- ✓ Enable connection timeout
- ✓ Monitor active connections

---

## Performance Optimization

### Connection Pool Settings

```typescript
// lib/hostinger-mysql.ts
const pool = mysql.createPool({
  connectionLimit: 30,      // Max concurrent connections
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});
```

### Recommended Settings:

- **Small app (100-500 users):** 10 connections
- **Medium app (500-5,000 users):** 30 connections (current)
- **Large app (5,000+ users):** 50 connections

---

## Migration from localStorage

If you were using localStorage and want to migrate to MySQL:

### Step 1: Export Current Data

```javascript
// In browser console
const data = {};
Object.keys(localStorage).forEach(key => {
  data[key] = localStorage.getItem(key);
});
console.log(JSON.stringify(data, null, 2));
```

### Step 2: Create Migration Script

```typescript
// scripts/migrate-data.ts
import { executeInsert } from '@/lib/hostinger-mysql';

// Import your exported data
const DATA = require('./exported-data.json');

export async function migrateData() {
  // Insert users
  for (const user of DATA.users) {
    await executeInsert(
      'INSERT INTO users (email, name, userType) VALUES (?, ?, ?)',
      [user.email, user.name, user.userType]
    );
  }
  // ... continue for other tables
}
```

### Step 3: Run Migration

```bash
npx ts-node scripts/migrate-data.ts
```

---

## Monitoring & Maintenance

### Weekly Checks:

- [ ] Verify database connection is working
- [ ] Check for high query times
- [ ] Review error logs

### Monthly Tasks:

- [ ] Backup database in Hostinger
- [ ] Review connection pool usage
- [ ] Check storage space used

### Performance Metrics:

Check Hostinger dashboard for:
- Database size
- Active connections
- Query performance
- Disk space usage

---

## Complete Checklist

- [ ] Step 1: Collected Hostinger credentials
- [ ] Step 2: Added 5 environment variables to Vercel
- [ ] Step 3: Deployed application to Vercel
- [ ] Step 4: Called `/api/init-db` endpoint
- [ ] Step 5: Verified with `/api/test-db` endpoint
- [ ] Step 6: (Optional) Ran Phase 2 upgrade
- [ ] Test: Verified tables in phpMyAdmin
- [ ] Test: Inserted test data
- [ ] Test: Queried test data
- [ ] Security: Protected credentials
- [ ] Performance: Verified connection pool settings

---

## Next Steps

1. **Start using the database** in your API routes
2. **Update components** to use database queries instead of localStorage
3. **Monitor performance** with Hostinger tools
4. **Scale gradually** as user base grows

Your Hostinger MySQL database is now fully activated and production-ready!

