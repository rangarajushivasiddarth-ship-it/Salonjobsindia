-- ==========================================
-- SALON JOBS INDIA: SUPABASE SCHEMA
-- ==========================================
-- Complete PostgreSQL schema for job posting + payment workflow
-- All tables have RLS enabled for security
-- Single source of truth for job status lifecycle

-- ==========================================
-- 1. USERS & PROFILES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('salon_owner', 'job_seeker', 'admin')) DEFAULT 'job_seeker',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. JOBS TABLE (Single Source of Truth)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  salon_name TEXT NOT NULL,
  job_type TEXT DEFAULT 'full-time',
  
  -- Payment & Status Fields (Single Source of Truth)
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PAYMENT_PENDING', 'APPROVED', 'LIVE', 'EXPIRED', 'CLOSED')) DEFAULT 'DRAFT',
  payment_status TEXT CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
  is_visible BOOLEAN DEFAULT FALSE,
  
  -- Payment Details
  payment_screenshot_url TEXT,
  payment_amount DECIMAL(10, 2),
  payment_plan TEXT,
  payment_submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Approval Tracking
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Job Details
  skills JSONB DEFAULT '[]',
  experience_required INTEGER DEFAULT 0,
  salary_min DECIMAL(10, 2) DEFAULT 0,
  salary_max DECIMAL(10, 2) DEFAULT 0,
  salary_currency TEXT DEFAULT 'INR',
  
  -- Location (GIS)
  location_coordinates GEOMETRY(POINT, 4326),
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Salon Owner
CREATE POLICY "jobs_select_own_pending" ON public.jobs
  FOR SELECT USING (auth.uid() = salon_owner_id);

CREATE POLICY "jobs_insert_own" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = salon_owner_id);

CREATE POLICY "jobs_update_own_draft" ON public.jobs
  FOR UPDATE USING (auth.uid() = salon_owner_id AND status = 'DRAFT');

-- RLS Policies: Admin (All jobs)
CREATE POLICY "jobs_admin_select_all" ON public.jobs
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "jobs_admin_update_all" ON public.jobs
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- RLS Policies: Job Seeker (Only live jobs)
CREATE POLICY "jobs_seeker_select_live" ON public.jobs
  FOR SELECT USING (
    status = 'LIVE' AND 
    is_visible = TRUE AND 
    payment_status = 'approved' AND
    (expires_at IS NULL OR expires_at > now())
  );

-- Indexes for performance
CREATE INDEX idx_jobs_salon_owner_id ON public.jobs(salon_owner_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_payment_status ON public.jobs(payment_status);
CREATE INDEX idx_jobs_is_visible ON public.jobs(is_visible);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_status_payment_visible ON public.jobs(status, payment_status, is_visible);

-- ==========================================
-- 3. JOB APPLICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(job_id, job_seeker_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_own" ON public.job_applications
  FOR SELECT USING (auth.uid() = job_seeker_id OR auth.uid() IN (SELECT salon_owner_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "applications_insert_own" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = job_seeker_id);

-- ==========================================
-- 4. AUDIT LOG (For tracking all changes)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity_id ON public.audit_log(entity_id);

-- ==========================================
-- 5. FUNCTIONS
-- ==========================================

-- Update job updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for jobs table
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Trigger for applications table
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Function to log job approval
CREATE OR REPLACE FUNCTION public.log_job_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, changes)
    VALUES (
      auth.uid(),
      'job_status_changed',
      'job',
      NEW.id,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_job_status_changes
AFTER UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.log_job_approval();

-- ==========================================
-- 6. VIEWS (For common queries)
-- ==========================================

-- Admin pending jobs view
CREATE OR REPLACE VIEW public.admin_pending_jobs AS
SELECT 
  j.id,
  j.title,
  j.salon_name,
  u.full_name as owner_name,
  u.email as owner_email,
  u.phone as owner_phone,
  j.payment_amount,
  j.payment_plan,
  j.payment_screenshot_url,
  j.payment_submitted_at,
  j.status,
  j.payment_status
FROM public.jobs j
JOIN public.users u ON j.salon_owner_id = u.id
WHERE j.status = 'PAYMENT_PENDING' AND j.payment_status = 'pending'
ORDER BY j.payment_submitted_at DESC;

-- Public live jobs view (for job seekers)
CREATE OR REPLACE VIEW public.public_live_jobs AS
SELECT 
  j.id,
  j.title,
  j.description,
  j.salon_name,
  j.job_type,
  j.skills,
  j.experience_required,
  j.salary_min,
  j.salary_max,
  j.location_address,
  j.location_city,
  j.location_state,
  j.view_count,
  j.application_count,
  j.posted_at,
  j.expires_at,
  u.full_name as salon_owner_name,
  u.phone as salon_phone
FROM public.jobs j
JOIN public.users u ON j.salon_owner_id = u.id
WHERE j.status = 'LIVE' AND j.is_visible = TRUE AND j.payment_status = 'approved'
  AND (j.expires_at IS NULL OR j.expires_at > now())
ORDER BY j.posted_at DESC;
