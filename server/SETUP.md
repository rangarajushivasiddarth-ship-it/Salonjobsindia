# Fitonze Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Twilio account for SMS OTP (optional in development)
- Vercel account for Blob storage

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string (32+ chars) for access tokens |
| `JWT_REFRESH_SECRET` | Random string (32+ chars) for refresh tokens |
| `ADMIN_SETUP_KEY` | Secret key to create the first admin |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |

Optional variables:

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Add your IP to the whitelist (or allow all IPs for development)
5. Get your connection string and add to `.env`

### 4. Get Vercel Blob Token

1. Go to your Vercel dashboard
2. Navigate to Storage > Blob
3. Create a new store
4. Copy the read-write token

### 5. Run the Server

Development mode with hot reload:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/register` | Complete registration |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/admin/create` | Create admin |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get my profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/location` | Update location |
| POST | `/api/users/portfolio` | Add portfolio item |
| DELETE | `/api/users/portfolio/:id` | Remove portfolio item |
| POST | `/api/users/work-history` | Add work experience |
| POST | `/api/users/certifications` | Add certification |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (with filters) |
| GET | `/api/jobs/nearby` | Get nearby jobs |
| GET | `/api/jobs/featured` | Get featured jobs |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create job (owner) |
| GET | `/api/jobs/owner/my-jobs` | Get my jobs (owner) |
| PUT | `/api/jobs/:id` | Update job |
| PATCH | `/api/jobs/:id/status` | Update job status |
| DELETE | `/api/jobs/:id` | Delete job |

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Apply to job |
| GET | `/api/applications/my-applications` | My applications |
| PUT | `/api/applications/:id/withdraw` | Withdraw application |
| GET | `/api/applications/job/:jobId` | Job applications (owner) |
| PUT | `/api/applications/:id/status` | Update status (owner) |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/plans` | Get available plans |
| GET | `/api/subscriptions/my-subscription` | Get my subscription |
| POST | `/api/subscriptions/subscribe` | Subscribe to plan |
| GET | `/api/subscriptions/pending` | Pending (admin) |
| PUT | `/api/subscriptions/:id/approve` | Approve (admin) |
| PUT | `/api/subscriptions/:id/reject` | Reject (admin) |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/avatar` | Upload avatar |
| POST | `/api/uploads/portfolio` | Upload portfolio image |
| POST | `/api/uploads/certification` | Upload certification |
| POST | `/api/uploads/payment-screenshot` | Upload payment proof |
| POST | `/api/uploads/resume` | Upload resume |
| DELETE | `/api/uploads` | Delete file |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/jobs` | List jobs |
| PATCH | `/api/admin/users/:id/toggle-status` | Toggle user status |
| PATCH | `/api/admin/jobs/:id/status` | Update job status |
| PATCH | `/api/admin/jobs/:id/feature` | Toggle featured |

## Creating First Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fitonze.com",
    "password": "your-secure-password",
    "name": "Admin User",
    "setupKey": "YOUR_ADMIN_SETUP_KEY"
  }'
```

## Deployment

### Railway

1. Connect your repo to Railway
2. Add environment variables
3. Deploy!

### Render

1. Create a new Web Service
2. Connect your repo
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Frontend Integration

Add to your frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

## Development Notes

- In development mode, OTPs are logged to the console instead of sent via SMS
- The server runs on port 5000 by default
- CORS is configured to allow requests from `http://localhost:3000`

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check the connection string format
- Verify database user credentials

### OTP Not Sending
- Check Twilio credentials
- In development, OTPs appear in the server console

### File Upload Issues
- Verify BLOB_READ_WRITE_TOKEN is correct
- Check file size limits (default: 10MB)
- Ensure correct file types
