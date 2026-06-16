-- Core Schema Migration for SalonJobsIndia
-- Consolidates all data to Supabase as single source of truth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- job_seekers table
CREATE TABLE IF NOT EXISTS job_seekers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  experience TEXT,
  skills TEXT[],
  salary_expectation TEXT,
  profile_photo_url TEXT,
  profile_photo_path TEXT,
  identity_proof_type TEXT,
  identity_proof_verified BOOLEAN DEFAULT FALSE,
  identity_proof_url TEXT,
  identity_proof_path TEXT,
  location_lat FLOAT8,
  location_lng FLOAT8,
  location_city TEXT,
  location_area TEXT,
  location_state TEXT,
  location_pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- salon_owners table
CREATE TABLE IF NOT EXISTS salon_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  salon_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  salon_address TEXT,
  location_lat FLOAT8,
  location_lng FLOAT8,
  location_city TEXT,
  location_area TEXT,
  location_state TEXT,
  location_pincode TEXT,
  banner_logo_url TEXT,
  banner_logo_path TEXT,
  salon_gallery_urls TEXT[],
  salon_gallery_paths TEXT[],
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT,
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  credits BIGINT DEFAULT 30,
  jobs_posted BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  salary_range TEXT,
  location_city TEXT,
  location_area TEXT,
  job_type TEXT,
  experience_required TEXT,
  status TEXT DEFAULT 'pending',
  is_live BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (owner_id) REFERENCES salon_owners(user_id)
);

-- applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  job_seeker_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  resume_title TEXT NOT NULL,
  resume_url TEXT,
  resume_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES job_seekers(user_id)
);

-- subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  plan_name TEXT,
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES salon_owners(user_id)
);

-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount DECIMAL(10, 2),
  screenshot_url TEXT,
  screenshot_path TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  balance BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  credits_changed BIGINT,
  balance_before BIGINT,
  balance_after BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- file_metadata table for tracking all uploads
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_category TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  public_url TEXT,
  storage_location TEXT DEFAULT 'hostinger',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT
);

-- Enable RLS on all tables
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX idx_salon_owners_user_id ON salon_owners(user_id);
CREATE INDEX idx_jobs_owner_id ON jobs(owner_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_seeker_id ON applications(job_seeker_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);

-- RLS Policies
-- Job seekers can view all live jobs
CREATE POLICY "job_seekers_view_live_jobs" ON jobs
  FOR SELECT
  USING (is_live = true);

-- Salon owners can manage only their jobs
CREATE POLICY "salon_owners_manage_own_jobs" ON jobs
  FOR ALL
  USING (owner_id = current_user_id());

-- Job seekers can view only their own profile
CREATE POLICY "job_seekers_view_own_profile" ON job_seekers
  FOR SELECT
  USING (user_id = current_user_id());

-- Salon owners can view only their own profile
CREATE POLICY "salon_owners_view_own_profile" ON salon_owners
  FOR SELECT
  USING (user_id = current_user_id());

-- File metadata accessible only to uploader
CREATE POLICY "file_metadata_owner_access" ON file_metadata
  FOR ALL
  USING (user_id = current_user_id());
