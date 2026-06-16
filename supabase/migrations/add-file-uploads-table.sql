-- Create file_uploads table for storing file metadata
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT category_check CHECK (category IN ('profile-photo', 'resume', 'payment-screenshot', 'verification-document', 'banner-logo', 'salon-gallery'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON public.file_uploads(category);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON public.file_uploads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own uploads
CREATE POLICY "Users can view their own file uploads" 
  ON public.file_uploads 
  FOR SELECT 
  USING (uploaded_by = auth.uid());

-- RLS Policy: Users can insert their own uploads
CREATE POLICY "Users can upload files" 
  ON public.file_uploads 
  FOR INSERT 
  WITH CHECK (uploaded_by = auth.uid());

-- RLS Policy: Users can delete their own uploads
CREATE POLICY "Users can delete their own file uploads" 
  ON public.file_uploads 
  FOR DELETE 
  USING (uploaded_by = auth.uid());

-- RLS Policy: Admin can view all uploads (if you have admin role)
CREATE POLICY "Admin can view all file uploads" 
  ON public.file_uploads 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admin can delete any upload
CREATE POLICY "Admin can delete any file upload" 
  ON public.file_uploads 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
