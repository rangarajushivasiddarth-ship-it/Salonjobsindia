# Hostinger MySQL Database Setup - Complete Step-by-Step Guide

## Prerequisites
- Hostinger hosting account with MySQL database
- Vercel project connected to GitHub
- SalonJobsIndia repository cloned locally

---

## STEP 1: Get Your Hostinger Database Credentials

### From Hostinger Control Panel:

1. Log in to **Hostinger.com**
2. Go to **Hosting → Manage**
3. Click on your hosting package
4. Go to **MySQL Databases** section
5. Find your database and click **Manage**
6. Copy these credentials:
   - **Host/Server**: `auth-db1675.hstgr.io` (or your specific host)
   - **Database Name**: `u848359456_salonjobsindia` (or your database name)
   - **Username**: `u848359456_salonjobsindia` (or your username)
   - **Password**: Your database password

**Keep these credentials secure - you'll need them for Vercel environment variables**

---

## STEP 2: Set Environment Variables in Vercel

### In Vercel Dashboard:

1. Go to **https://vercel.com** and sign in
2. Select your **SalonJobsIndia** project
3. Click **Settings** (top menu)
4. Go to **Environment Variables** (left sidebar)
5. Add these variables:

```
DATABASE_HOST = auth-db1675.hstgr.io
DATABASE_PORT = 3306
DATABASE_NAME = u848359456_salonjobsindia
DATABASE_USER = u848359456_salonjobsindia
DATABASE_PASSWORD = [your-password-here]
```

6. For each variable:
   - Enter the key (e.g., `DATABASE_HOST`)
   - Enter the value
   - Select environments: **Production, Preview, Development**
   - Click **Save**

✓ All 5 environment variables should now be listed

---

## STEP 3: Deploy to Vercel

### Option A: Via Git Push

```bash
# Navigate to project directory
cd /path/to/v0-project

# Make sure all changes are committed
git status

# Push to GitHub (which triggers Vercel deployment)
git push origin main
```

### Option B: Via Vercel Dashboard

1. Go to Vercel project
2. Go to **Deployments** tab
3. Click **Redeploy** on latest deployment
4. Vercel will use new environment variables automatically

**Wait for deployment to complete** (status shows "Ready")

---

## STEP 4: Initialize Database Tables

### Via API Endpoint:

Once deployment is complete, initialize the database by calling the init-db endpoint:

```bash
# Replace with your Vercel domain
curl -X POST https://salonjobsindia.vercel.app/api/init-db
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "tablesCreated": 10
}
```

### Alternative: Via Browser

Open this URL in your browser:
```
https://salonjobsindia.vercel.app/api/init-db
```

(Change `salonjobsindia.vercel.app` to your actual Vercel domain)

---

## STEP 5: Verify Database Connection

### Test the Connection:

```bash
curl -X GET https://salonjobsindia.vercel.app/api/test-db
```

**Expected Response:**
```json
{
  "connected": true,
  "message": "Database connection successful"
}
```

✓ If you see this, your database is connected!

---

## STEP 6: Run Phase 2 Upgrade (Optional - For Indexes & Performance)

### Initialize Performance Indexes:

```bash
curl -X POST https://salonjobsindia.vercel.app/api/phase2-upgrade
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database upgraded with indexes"
}
```

---

## Database Tables Created

The `/api/init-db` endpoint automatically creates these 10 tables:

| Table | Purpose |
|-------|---------|
| `users` | All users (job seekers, salon owners, admins) |
| `jobs` | Job postings |
| `salon_profiles` | Salon owner business profiles |
| `applications` | Job applications from seekers |
| `messages` | Direct messages between users |
| `subscriptions` | User subscription records |
| `notifications` | System notifications |
| `payments` | Payment transaction records |
| `job_alerts` | Saved job search alerts |
| `audit_logs` | Admin action audit trail |

---

## Troubleshooting

### Issue: "Connection refused"

**Solution:**
1. Check environment variables are saved in Vercel
2. Verify credentials are correct from Hostinger
3. Check if Hostinger MySQL service is running
4. Wait 5 minutes after setting env vars (propagation delay)

### Issue: "Table already exists"

**Solution:**
- Database tables are already initialized
- You can start using the database
- If you need to reset, drop tables manually in Hostinger, then call `/api/init-db` again

### Issue: "Unknown host"

**Solution:**
1. Verify `DATABASE_HOST` is correct (e.g., `auth-db1675.hstgr.io`)
2. Check if host is accessible from Vercel region
3. Contact Hostinger support if host not found

### Issue: "Authentication failed"

**Solution:**
1. Double-check username and password
2. Make sure password doesn't have special characters that need escaping
3. Verify database user has all privileges

---

## Using the Database in Your Code

### Query Data
```typescript
import { executeQuery } from '@/lib/hostinger-mysql';

const users = await executeQuery(
  'SELECT * FROM users WHERE userType = ?',
  ['job_seeker']
);
```

### Insert Data
```typescript
import { executeInsert } from '@/lib/hostinger-mysql';

const result = await executeInsert(
  'INSERT INTO users (name, email, userType) VALUES (?, ?, ?)',
  ['John Doe', 'john@example.com', 'job_seeker']
);
```

### Update Data
```typescript
import { executeUpdate } from '@/lib/hostinger-mysql';

const result = await executeUpdate(
  'UPDATE users SET name = ? WHERE id = ?',
  ['Updated Name', 123]
);
```

### Delete Data
```typescript
import { executeQuery } from '@/lib/hostinger-mysql';

const result = await executeQuery(
  'DELETE FROM users WHERE id = ?',
  [123]
);
```

---

## Migration from localStorage to Database

If you're currently using localStorage (in-memory storage) and want to migrate to MySQL:

### Step 1: Backup localStorage Data
```javascript
// Run in browser console
Object.keys(localStorage).forEach(key => {
  console.log(`${key}:`, localStorage.getItem(key));
});
```

### Step 2: Import to Database
```typescript
import { executeInsert } from '@/lib/hostinger-mysql';

// Example: Migrate users
const users = JSON.parse(localStorage.getItem('users') || '[]');
for (const user of users) {
  await executeInsert(
    'INSERT INTO users (name, email, userType) VALUES (?, ?, ?)',
    [user.name, user.email, user.userType]
  );
}
```

### Step 3: Update App to Use Database
- Replace localStorage calls with executeQuery()
- Update components to fetch from database
- Remove localStorage writes

---

## Performance Tips

1. **Connection Pooling**: Already set to 30 connections - optimal for 1,000+ concurrent users
2. **Indexes**: Created automatically on primary keys and foreign keys
3. **Query Optimization**: Use `LIMIT` and `WHERE` clauses for large tables
4. **Caching**: Consider caching frequently accessed data

---

## Security Best Practices

1. **Never commit passwords** to Git
2. **Use environment variables** for all credentials
3. **Enable SSL/TLS** on Hostinger MySQL connection
4. **Use parameterized queries** (? placeholders) - already done in code
5. **Regular backups** - enabled in Hostinger settings

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/hostinger-mysql.ts` | MySQL connection pool and query functions |
| `lib/database-schema.ts` | Database table schemas (SQL CREATE statements) |
| `app/api/init-db/route.ts` | Endpoint to initialize all tables |
| `app/api/test-db/route.ts` | Endpoint to test database connection |
| `app/api/phase2-upgrade/route.ts` | Endpoint to add indexes and upgrade |

---

## Support

### Hostinger Support
- Hostinger Help Center: https://support.hostinger.com
- MySQL Documentation: https://dev.mysql.com/doc/

### Vercel Support
- Vercel Docs: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

### Your Application Logs
- Check Vercel deployment logs for errors
- Use browser console for frontend errors
- Check terminal for local development errors

---

## Summary Checklist

- [ ] Got Hostinger database credentials
- [ ] Set 5 environment variables in Vercel
- [ ] Deployed to Vercel
- [ ] Called `/api/init-db` endpoint
- [ ] Verified connection with `/api/test-db`
- [ ] (Optional) Ran `/api/phase2-upgrade`
- [ ] Ready to use database!

**Your Hostinger MySQL database is now ready for production!**

