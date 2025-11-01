-- Add delete policy for assignments (teachers only)
CREATE POLICY "Teachers can delete assignments"
ON public.assignments
FOR DELETE
TO authenticated
USING (
  public.is_teacher_for_course(auth.uid(), course_id)
);

-- Add file_url column to assignments for storing uploaded PDFs
ALTER TABLE public.assignments
ADD COLUMN file_url text;

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', false);

-- Storage policies for assignment files
CREATE POLICY "Teachers can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can update their assignment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can delete their assignment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- All enrolled users can view assignment files
CREATE POLICY "Users can view assignment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files'
);