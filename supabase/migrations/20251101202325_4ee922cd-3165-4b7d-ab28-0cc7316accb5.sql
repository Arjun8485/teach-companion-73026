-- Create storage buckets for assignment and submission files (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('assignment-files', 'assignment-files', true),
  ('submission-files', 'submission-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop and recreate RLS policies for assignment-files bucket
DROP POLICY IF EXISTS "Anyone can view assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete assignment files" ON storage.objects;

CREATE POLICY "Anyone can view assignment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-files');

CREATE POLICY "Teachers can upload assignment files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.student_id = auth.uid()
    AND user_roles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can delete assignment files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assignment-files'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.student_id = auth.uid()
    AND user_roles.role = 'teacher'
  )
);

-- Drop and recreate RLS policies for submission-files bucket
DROP POLICY IF EXISTS "Students can view own submission files" ON storage.objects;
DROP POLICY IF EXISTS "TAs can view submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete own submission files" ON storage.objects;

CREATE POLICY "Students can view own submission files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submission-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "TAs can view submission files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submission-files'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.student_id = auth.uid()
    AND user_roles.role IN ('ta', 'teacher')
  )
);

CREATE POLICY "Students can upload own submission files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submission-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete own submission files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'submission-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for teachers to update assignments
DROP POLICY IF EXISTS "Teachers can update assignments" ON assignments;
CREATE POLICY "Teachers can update assignments"
ON assignments FOR UPDATE
USING (is_teacher_for_course(auth.uid(), course_id));

-- Allow teachers to update grades even after finalized
DROP POLICY IF EXISTS "TAs can grade submissions" ON submissions;
CREATE POLICY "TAs can grade submissions"
ON submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN assignments a ON a.id = submissions.assignment_id
    WHERE ur.student_id = auth.uid()
    AND ur.course_id = a.course_id
    AND ur.role IN ('ta', 'teacher')
  )
);