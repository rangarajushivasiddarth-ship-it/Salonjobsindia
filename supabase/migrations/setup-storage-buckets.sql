-- Supabase Storage Buckets Setup for SalonJobsIndia
-- Run this in your Supabase SQL editor to create all storage buckets and RLS policies

-- Create buckets
INSERT INTO storage.buckets (id, name, public, owner, created_at, updated_at)
VALUES 
  ('profile-photos', 'profile-photos', true, 'supabase', now(), now()),
  ('resumes', 'resumes', true, 'supabase', now(), now()),
  ('payment-screenshots', 'payment-screenshots', false, 'supabase', now(), now()),
  ('verification-documents', 'verification-documents', false, 'supabase', now(), now()),
  ('banner-logos', 'banner-logos', true, 'supabase', now(), now()),
  ('salon-gallery', 'salon-gallery', true, 'supabase', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Profile Photos - Public read, authenticated users can upload their own
CREATE POLICY "Profile photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Resumes - Public read, authenticated users can upload their own
CREATE POLICY "Resumes are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Payment Screenshots - Private, only admin can read
CREATE POLICY "Admins can read payment screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-screenshots'
    AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload payment screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete payment screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment-screenshots'
    AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

-- Verification Documents - Private, only admin can read
CREATE POLICY "Admins can read verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete verification documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

-- Banner Logos - Public read, only salon owners/admin can upload
CREATE POLICY "Banner logos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-logos');

CREATE POLICY "Salon owners and admins can upload banner logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-logos'
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM salon_owners WHERE salon_owners.id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Salon owners and admins can delete banner logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-logos'
    AND (
      EXISTS (
        SELECT 1 FROM salon_owners WHERE salon_owners.id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
      )
    )
  );

-- Salon Gallery - Public read, only salon owners can upload
CREATE POLICY "Salon gallery images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-gallery');

CREATE POLICY "Salon owners can upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'salon-gallery'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM salon_owners WHERE salon_owners.id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can delete their gallery images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'salon-gallery'
    AND EXISTS (
      SELECT 1 FROM salon_owners WHERE salon_owners.id = auth.uid()
    )
  );

-- Grant public access for reading from public buckets (profile-photos, resumes, banner-logos, salon-gallery)
GRANT SELECT ON storage.objects TO anon;
