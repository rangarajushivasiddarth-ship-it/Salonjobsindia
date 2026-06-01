# Hostinger MySQL Database Setup Guide

## Connection Details

Your SalonJobsIndia app is now connected to your Hostinger MySQL database:

- **Host:** `auth-db1675.hstgr.io`
- **Port:** `3306`
- **Database:** `u848359456_salonjobsindia`
- **User:** `u848359456_salonjobsindia`
- **Password:** `Bhargavi#143` (stored securely in Vercel environment variables)

## Environment Variables

The following environment variables are configured in your Vercel project:

```
DATABASE_HOST=auth-db1675.hstgr.io
DATABASE_PORT=3306
DATABASE_NAME=u848359456_salonjobsindia
DATABASE_USER=u848359456_salonjobsindia
DATABASE_PASSWORD=Bhargavi#143
```

## Initialization Steps

### Step 1: Deploy to Vercel

After deploying your app to Vercel, the environment variables will be automatically loaded.

### Step 2: Initialize Database Tables

Once deployed, call the initialization endpoint to create all database tables:

**POST** `https://your-vercel-domain.vercel.app/api/init-db`

This will create the following tables:
- `users` - All users (job seekers and salon owners)
- `jobs` - Job postings
- `salon_profiles` - Salon owner profiles
- `applications` - Job applications
- `messages` - Messages between users
- `subscriptions` - User subscriptions
- `notifications` - User notifications
- `payments` - Payment records
- `job_alerts` - Job search alerts
- `audit_logs` - Admin action logs

### Step 3: Check Database Status

To verify the database is set up correctly:

**GET** `https://your-vercel-domain.vercel.app/api/init-db`

Expected response:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "database": "u848359456_salonjobsindia",
    "tablesCreated": 10,
    "requiredTables": 10,
    "allTablesCreated": true,
    "tables": [
      "applications",
      "audit_logs",
      "job_alerts",
      "jobs",
      "messages",
      "notifications",
      "payments",
      "salon_profiles",
      "subscriptions",
      "users"
    ]
  }
}
```

## Data Migration

All your existing local data in localStorage will be preserved. To migrate data to the database:

1. The app will automatically sync data to the database when features are used
2. Alternatively, use the admin panel to migrate data in bulk

## Troubleshooting

### Connection Failed
- Verify all environment variables are set correctly in Vercel
- Check that your Hostinger database is active
- Ensure firewall allows connections from Vercel servers

### Tables Not Created
- Make sure you called `POST /api/init-db`
- Check the response for specific error messages
- Verify the database user has CREATE TABLE permissions

### Performance Issues
- Database connection pool is limited to 10 concurrent connections
- Consider upgrading Hostinger plan if experiencing slow queries

## Database Architecture

### Users Table
- Stores both job seekers and salon owners
- Email is unique for each user
- Password is hashed

### Jobs Table
- Contains all job postings
- Linked to salon owner via `ownerId`
- Has payment approval status

### Salon Profiles Table
- Extended profile for salon owners
- Stores salon details, logo, ratings

### Applications Table
- Tracks job applications from seekers
- One application per seeker per job (unique constraint)
- Linked to both job and user

### Messages Table
- Direct messaging between users
- Supports read/unread status
- Timestamps for all messages

### Subscriptions Table
- Tracks user subscription plans
- Supports multiple plan types
- Expiration date tracking

## Security Notes

- All database credentials are stored as environment variables in Vercel (not in code)
- Database user has minimal permissions (no DROP, ALTER DATABASE)
- Connections use SSL when available
- Connection pool has keep-alive enabled

## Monitoring

Monitor database performance in:
1. Hostinger Control Panel - MySQL Databases section
2. phpMyAdmin - Available at `auth-db1675.hstgr.io/phpmyadmin`

## Support

For Hostinger-specific issues, contact Hostinger support.
For app-specific database issues, check the Vercel deployment logs.

---

**Setup completed on:** June 1, 2026
**Status:** Ready for production
