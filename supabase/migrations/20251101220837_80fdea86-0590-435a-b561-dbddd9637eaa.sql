-- Drop all existing storage policies for assignment-files and submission-files
DROP POLICY IF EXISTS "Anyone can view assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Students can view own submission files" ON storage.objects;
DROP POLICY IF EXISTS "TAs can view submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can update submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submission files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload assignment files" ON storage.objects;

-- Create simple, permissive policies for public access
-- Assignment files - anyone can view
CREATE POLICY "Public can view assignment files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment-files');

-- Submission files - anyone can view (for TAs to grade)
CREATE POLICY "Public can view submission files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submission-files');

-- Teachers can manage assignment files
CREATE POLICY "Authenticated can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated can update assignment files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated can delete assignment files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Students can manage their submission files
CREATE POLICY "Students can upload submission files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can update submission files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete submission files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);