-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', true);

-- Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submission-files', 'submission-files', false);

-- RLS policies for assignment-files bucket
-- Teachers can upload assignment files
CREATE POLICY "Teachers can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
    AND role = 'teacher'
  )
);

-- Teachers can update assignment files
CREATE POLICY "Teachers can update assignment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
    AND role = 'teacher'
  )
);

-- Teachers can delete assignment files
CREATE POLICY "Teachers can delete assignment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
    AND role = 'teacher'
  )
);

-- Everyone can view assignment files (public bucket)
CREATE POLICY "Anyone can view assignment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'assignment-files');

-- RLS policies for submission-files bucket
-- Students can upload their own submission files
CREATE POLICY "Students can upload own submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Students can update their own submission files
CREATE POLICY "Students can update own submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (storage.foldername(name))[3] = auth.uid()::text
);

-- TAs and teachers can view all submissions
CREATE POLICY "TAs and teachers can view all submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
    AND role IN ('ta', 'teacher')
  )
);