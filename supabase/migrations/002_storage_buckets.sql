-- Supabase Storage Configuration
-- Creates 6 storage buckets with RLS policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resumes', 'resumes', false, 10485760, '{"application/pdf"}'),
  ('profile-photos', 'profile-photos', true, 5242880, '{"image/jpeg","image/png","image/webp"}'),
  ('payment-screenshots', 'payment-screenshots', false, 5242880, '{"image/jpeg","image/png","image/webp","application/pdf"}'),
  ('verification-documents', 'verification-documents', false, 10485760, '{"image/jpeg","image/png","image/webp","application/pdf"}'),
  ('banners', 'banners', true, 10485880, '{"image/jpeg","image/png","image/webp"}'),
  ('salon-gallery', 'salon-gallery', true, 10485760, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for resumes (private)
CREATE POLICY "Users can upload resumes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = owner);

CREATE POLICY "Users can download their resumes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = owner);

-- Storage RLS Policies for profile-photos (public read, private write)
CREATE POLICY "Users can upload profile photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = owner);

CREATE POLICY "Profile photos publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Storage RLS Policies for payment-screenshots (private)
CREATE POLICY "Users can upload payment screenshots"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = owner);

CREATE POLICY "Users can download own payment screenshots"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = owner);

-- Storage RLS Policies for verification-documents (private)
CREATE POLICY "Users can upload verification docs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = owner);

CREATE POLICY "Users can access own verification docs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'verification-documents' AND auth.uid()::text = owner);

-- Storage RLS Policies for banners (public read, private write)
CREATE POLICY "Salon owners can upload banners"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = owner);

CREATE POLICY "Banners publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'banners');

-- Storage RLS Policies for salon-gallery (public read, private write)
CREATE POLICY "Salon owners can upload gallery"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'salon-gallery' AND auth.uid()::text = owner);

CREATE POLICY "Gallery publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'salon-gallery');
