-- Supabase Database Schema for SalonJobsIndia
-- Run this in your Supabase SQL editor to create all required tables with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgtrgm";

-- ============ ADMIN USERS TABLE ============
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ JOB SEEKERS TABLE ============
CREATE TABLE IF NOT EXISTS job_seekers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  profilePhoto TEXT,
  bio TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  area TEXT,
  state TEXT,
  pincode TEXT,
  isVerified BOOLEAN DEFAULT false,
  isSubscribed BOOLEAN DEFAULT false,
  subscriptionExpiresAt TIMESTAMP,
  profession TEXT,
  experience INTEGER,
  skills TEXT[] DEFAULT '{}',
  resumeUrl TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ SALON OWNERS TABLE ============
CREATE TABLE IF NOT EXISTS salon_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  salonName TEXT NOT NULL,
  salonPhoto TEXT,
  salonAddress TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  area TEXT,
  state TEXT,
  pincode TEXT,
  salonLogo TEXT,
  isVerified BOOLEAN DEFAULT false,
  isSubscribed BOOLEAN DEFAULT false,
  subscriptionExpiresAt TIMESTAMP,
  totalJobsPosted INTEGER DEFAULT 0,
  totalJobsActive INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ JOBS TABLE ============
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salonOwnerId UUID NOT NULL REFERENCES salon_owners(id) ON DELETE CASCADE,
  salonName TEXT NOT NULL,
  salonContact TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  area TEXT,
  state TEXT,
  pincode TEXT,
  salary TEXT,
  experienceRequired INTEGER,
  requiredSkills TEXT[] DEFAULT '{}',
  jobType TEXT, -- 'full-time', 'part-time', 'contract'
  status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'live', 'expired', 'closed'
  isActive BOOLEAN DEFAULT true,
  isVerified BOOLEAN DEFAULT false,
  paymentId UUID,
  paymentApprovedAt TIMESTAMP,
  approvedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now(),
  expiresAt TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT now(),
  viewsCount INTEGER DEFAULT 0,
  applicationsCount INTEGER DEFAULT 0,
  editsUsed INTEGER DEFAULT 0,
  maxEdits INTEGER DEFAULT 3
);

-- ============ JOB APPLICATIONS TABLE ============
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jobId UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  jobSeekerId UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
  jobSeekerName TEXT,
  jobSeekerPhone TEXT,
  jobSeekerEmail TEXT,
  resumeUrl TEXT,
  coverLetter TEXT,
  status TEXT DEFAULT 'applied', -- 'applied', 'reviewing', 'accepted', 'rejected'
  appliedAt TIMESTAMP DEFAULT now(),
  respondedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ SUBSCRIPTIONS TABLE ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  userName TEXT,
  userPhone TEXT,
  userRole TEXT, -- 'job_seeker' or 'salon_owner'
  planType TEXT NOT NULL,
  planName TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  screenshotUrl TEXT,
  transactionId TEXT,
  paymentMethod TEXT, -- 'upi', 'card', 'netbanking'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  jobPostsTotal INTEGER,
  jobPostsUsed INTEGER DEFAULT 0,
  contactCredits INTEGER,
  createdAt TIMESTAMP DEFAULT now(),
  approvedAt TIMESTAMP,
  expiresAt TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  userName TEXT,
  userPhone TEXT,
  salonName TEXT,
  type TEXT NOT NULL, -- 'job_publishing', 'verified_badge', 'contact_pack', 'job_seeker_subscription'
  planId TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  screenshotUrl TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  jobId UUID,
  resumeId UUID,
  contactCredits INTEGER,
  validityDays INTEGER DEFAULT 30,
  transactionId TEXT,
  submittedAt TIMESTAMP DEFAULT now(),
  approvedAt TIMESTAMP,
  processedBy UUID,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- ============ NOTIFICATIONS TABLE ============
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  link TEXT,
  isRead BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT now()
);

-- ============ LOCATIONS TABLE ============
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  area TEXT,
  state TEXT,
  pincode TEXT,
  accuracy DECIMAL(10, 2),
  lastUpdated TIMESTAMP DEFAULT now(),
  createdAt TIMESTAMP DEFAULT now()
);

-- ============ ADMIN ACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adminId UUID NOT NULL REFERENCES admin_users(id),
  actionType TEXT NOT NULL,
  targetType TEXT, -- 'payment', 'job', 'user'
  targetId UUID,
  details JSONB,
  createdAt TIMESTAMP DEFAULT now()
);

-- ============ INDEXES FOR PERFORMANCE ============
CREATE INDEX IF NOT EXISTS idx_jobs_salonOwnerId ON jobs(salonOwnerId);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_createdAt ON jobs(createdAt);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs USING gist(
  earth_box(ll_to_earth(latitude, longitude), 5000)
);

CREATE INDEX IF NOT EXISTS idx_applications_jobId ON applications(jobId);
CREATE INDEX IF NOT EXISTS idx_applications_jobSeekerId ON applications(jobSeekerId);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_job_seekers_location ON job_seekers USING gist(
  earth_box(ll_to_earth(latitude, longitude), 5000)
);

CREATE INDEX IF NOT EXISTS idx_salon_owners_email ON salon_owners(email);

CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiresAt ON subscriptions(expiresAt);

CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments(userId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);

-- ============ ROW LEVEL SECURITY (RLS) POLICIES ============

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ========== JOB SEEKERS RLS ==========
-- Job seekers can read their own profile
CREATE POLICY "Job seekers can read their own profile"
  ON job_seekers FOR SELECT
  USING (auth.uid() = id);

-- Job seekers can update their own profile
CREATE POLICY "Job seekers can update their own profile"
  ON job_seekers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all job seekers
CREATE POLICY "Admins can read all job seekers"
  ON job_seekers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== SALON OWNERS RLS ==========
-- Salon owners can read their own profile
CREATE POLICY "Salon owners can read their own profile"
  ON salon_owners FOR SELECT
  USING (auth.uid() = id);

-- Salon owners can update their own profile
CREATE POLICY "Salon owners can update their own profile"
  ON salon_owners FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all salon owners
CREATE POLICY "Admins can read all salon owners"
  ON salon_owners FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== JOBS RLS ==========
-- Anyone can read published live jobs
CREATE POLICY "Anyone can read live jobs"
  ON jobs FOR SELECT
  USING (status = 'live' AND isActive = true);

-- Salon owners can read their own jobs
CREATE POLICY "Salon owners can read their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = salonOwnerId);

-- Salon owners can create jobs
CREATE POLICY "Salon owners can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = salonOwnerId);

-- Salon owners can update their own jobs
CREATE POLICY "Salon owners can update their own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = salonOwnerId)
  WITH CHECK (auth.uid() = salonOwnerId);

-- Admins can read all jobs
CREATE POLICY "Admins can read all jobs"
  ON jobs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== APPLICATIONS RLS ==========
-- Job seekers can read their own applications
CREATE POLICY "Job seekers can read their applications"
  ON applications FOR SELECT
  USING (auth.uid() = jobSeekerId);

-- Job seekers can apply for jobs
CREATE POLICY "Job seekers can apply for jobs"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = jobSeekerId);

-- Salon owners can read applications to their jobs
CREATE POLICY "Salon owners can read applications to their jobs"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.jobId 
      AND jobs.salonOwnerId = auth.uid()
    )
  );

-- Salon owners can update application status
CREATE POLICY "Salon owners can update application status"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.jobId 
      AND jobs.salonOwnerId = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.jobId 
      AND jobs.salonOwnerId = auth.uid()
    )
  );

-- Admins can read all applications
CREATE POLICY "Admins can read all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== SUBSCRIPTIONS RLS ==========
-- Users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = userId);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== PAYMENTS RLS ==========
-- Users can read their own payments
CREATE POLICY "Users can read their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = userId);

-- Users can insert their own payments
CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = userId);

-- Admins can read all payments
CREATE POLICY "Admins can read all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Admins can update payments
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== NOTIFICATIONS RLS ==========
-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = userId);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- ========== LOCATIONS RLS ==========
-- Users can read and write their own locations
CREATE POLICY "Users can read their own location"
  ON locations FOR SELECT
  USING (auth.uid() = userId);

CREATE POLICY "Users can update their own location"
  ON locations FOR UPDATE
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can insert their own location"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = userId);

-- Admins can read all locations
CREATE POLICY "Admins can read all locations"
  ON locations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- ========== ADMIN ACTIONS RLS ==========
-- Admins can read all admin actions
CREATE POLICY "Admins can read all admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Admins can insert admin actions
CREATE POLICY "Admins can insert admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
