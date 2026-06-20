-- Add job_seeker_preference column to users table if it doesn't exist
-- This allows job seekers to toggle "Looking for Work" / "Not Looking" status

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS job_seeker_preference TEXT 
  CHECK (job_seeker_preference IN ('looking_for_work', 'not_looking_for_job')) 
  DEFAULT 'looking_for_work';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_job_seeker_preference ON public.users(job_seeker_preference)
WHERE role = 'job_seeker';

-- Update RLS policy to allow job seekers to update their own preference
CREATE POLICY "users_update_own_with_preference" ON public.users
  FOR UPDATE USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
  ON CONFLICT DO NOTHING;
