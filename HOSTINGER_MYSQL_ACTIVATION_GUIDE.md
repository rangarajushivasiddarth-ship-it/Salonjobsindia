# Hostinger MySQL Database - Complete Activation Guide

## Current Status ✓

Your SalonJobsIndia application already has **full Hostinger MySQL integration** built in. The connection code, initialization endpoints, and database schema are all ready to use.

---

## Quick Activation (3 Steps)

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```
DATABASE_HOST=auth-db1675.hstgr.io
DATABASE_PORT=3306
DATABASE_NAME=u848359456_salonjobsindia
DATABASE_USER=u848359456_salonjobsindia
DATABASE_PASSWORD=Bhargavi#143
```

**Or use alternative variable names:**
```
HOSTINGER_DB_HOST=auth-db1675.hstgr.io
HOSTINGER_DB_PORT=3306
HOSTINGER_DB_NAME=u848359456_salonjobsindia
HOSTINGER_DB_USER=u848359456_salonjobsindia
HOSTINGER_DB_PASSWORD=Bhargavi#143
```

### Step 2: Deploy to Vercel

Push your changes to GitHub and deploy to Vercel:
```bash
git push origin main
```

Vercel will automatically load the environment variables.

### Step 3: Initialize Database Tables

Once deployed, call the initialization endpoint:

**POST** `https://your-vercel-domain.vercel.app/api/init-db`

This creates all required tables automatically.

---

## What Gets Set Up

### Database Connection Pool
- **File:** `lib/hostinger-mysql.ts`
- **Pool Size:** 30 connections (optimized for 500-5,000 users)
- **Features:**
  - Connection pooling with auto-reconnect
  - Keep-alive enabled
  - Big number support for large IDs

### Initialization Endpoint
- **File:** `app/api/init-db/route.ts`
- **Method:** POST
- **Creates 10 Tables:**
  - `users` - All users (job seekers & salon owners)
  - `jobs` - Job postings
  - `salon_profiles` - Salon owner profiles
  - `applications` - Job applications
  - `messages` - Messages between users
  - `subscriptions` - User subscriptions
  - `notifications` - User notifications
  - `payments` - Payment records
  - `job_alerts` - Job search alerts
  - `audit_logs` - Admin action logs

### Database Schema
- **File:** `lib/database-schema.ts`
- **254 Lines of SQL schemas**
- **Auto-generated CREATE TABLE statements**

---

## Testing Database Connection

### Test Endpoint
**GET** `https://your-vercel-domain.vercel.app/api/test-db`

Expected response (if connected):
```json
{
  "connected": true,
  "message": "Database connection successful"
}
```

### Manual Test
```bash
curl -X GET https://your-vercel-domain.vercel.app/api/test-db
```

---

## Usage in Your Code

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

---

## Database Schema Details

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  userType ENUM('job_seeker', 'salon_owner', 'admin'),
  location VARCHAR(255),
  phone VARCHAR(20),
  isVerified BOOLEAN DEFAULT FALSE,
  verifiedUntil DATETIME,
  credits INT DEFAULT 0,
  subscriptionActive BOOLEAN DEFAULT FALSE,
  subscriptionExpiry DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  salonId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  salary_min INT,
  salary_max INT,
  status ENUM('pending', 'live', 'closed') DEFAULT 'pending',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approvedAt DATETIME,
  FOREIGN KEY (salonId) REFERENCES users(id)
);
```

---

## Migration from localStorage to MySQL

If you're currently using localStorage (in-memory storage) and want to migrate to MySQL:

1. **Backup your current data**
   ```bash
   # Export localStorage data from browser console
   Object.keys(localStorage).forEach(key => {
     console.log(`${key}:`, localStorage.getItem(key));
   });
   ```

2. **Import data into MySQL** using the data-store migration functions

3. **Update app context** to use database queries instead of localStorage

---

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_HOST` | auth-db1675.hstgr.io | Hostinger server hostname |
| `DATABASE_PORT` | 3306 | MySQL default port |
| `DATABASE_NAME` | u848359456_salonjobsindia | Database name |
| `DATABASE_USER` | u848359456_salonjobsindia | Database user |
| `DATABASE_PASSWORD` | Bhargavi#143 | Database password |

---

## Troubleshooting

### Connection Refused
- Check if environment variables are set in Vercel
- Verify Hostinger MySQL service is running
- Check if firewall allows port 3306

### Query Errors
- Check SQL syntax in database-schema.ts
- Verify table names match queries
- Check data types match column definitions

### Timeout Issues
- Increase connection pool size in hostinger-mysql.ts
- Check Hostinger database performance
- Verify network connectivity

---

## Files Involved

| File | Purpose |
|------|---------|
| `lib/hostinger-mysql.ts` | MySQL connection pool & query execution |
| `lib/database-schema.ts` | Database schema definitions |
| `app/api/init-db/route.ts` | Database initialization endpoint |
| `app/api/test-db/route.ts` | Connection testing endpoint |
| `lib/mongodb.ts` | MongoDB alternative (optional) |

---

## Next Steps

1. **Set environment variables** in Vercel project settings
2. **Deploy to Vercel** to activate the integration
3. **Call `/api/init-db`** POST endpoint to create tables
4. **Verify with `/api/test-db`** GET endpoint
5. **Update your app** to use database queries

---

## Support

For issues:
- Check Hostinger control panel for database status
- Review Vercel deployment logs
- Check environment variables are correctly set
- Verify MySQL credentials are accurate

Your Hostinger MySQL database is ready to power SalonJobsIndia!
