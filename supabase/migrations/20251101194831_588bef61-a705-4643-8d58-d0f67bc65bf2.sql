-- Fix storage bucket and add assignment questions and submissions

-- Ensure the assignment-files bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Add questions structure and max_marks to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS max_marks integer DEFAULT 0;

COMMENT ON COLUMN public.assignments.questions IS 'Array of question objects with max_marks: [{"question_number": 1, "max_marks": 10}]';

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url text,
  completed_questions jsonb DEFAULT '[]'::jsonb,
  question_marks jsonb DEFAULT '{}'::jsonb,
  total_marks integer DEFAULT 0,
  grading_finalized boolean DEFAULT false,
  submitted_at timestamp with time zone DEFAULT now(),
  graded_by uuid REFERENCES public.profiles(id),
  graded_at timestamp with time zone,
  UNIQUE(assignment_id, student_id)
);

COMMENT ON COLUMN public.submissions.completed_questions IS 'Array of completed question numbers: [1, 2, 3]';
COMMENT ON COLUMN public.submissions.question_marks IS 'Object mapping question number to marks: {"1": 8, "2": 5}';

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON public.submissions
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert their own submissions
CREATE POLICY "Students can create own submissions"
  ON public.submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions (before finalized)
CREATE POLICY "Students can update own submissions"
  ON public.submissions
  FOR UPDATE
  USING (student_id = auth.uid() AND grading_finalized = false);

-- TAs and teachers can view submissions for their courses
CREATE POLICY "TAs can view course submissions"
  ON public.submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN assignments a ON a.id = submissions.assignment_id
      WHERE ur.student_id = auth.uid()
        AND ur.course_id = a.course_id
        AND ur.role IN ('ta', 'teacher')
    )
  );

-- TAs and teachers can update submissions (grading)
CREATE POLICY "TAs can grade submissions"
  ON public.submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN assignments a ON a.id = submissions.assignment_id
      WHERE ur.student_id = auth.uid()
        AND ur.course_id = a.course_id
        AND ur.role IN ('ta', 'teacher')
    )
  );

-- Update storage policies for assignment files
DROP POLICY IF EXISTS "Teachers can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view assignment files" ON storage.objects;

-- Teachers can upload assignment files
CREATE POLICY "Teachers can upload assignment files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-files' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE student_id = auth.uid()
        AND role = 'teacher'
    )
  );

-- Teachers can update their assignment files
CREATE POLICY "Teachers can update assignment files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'assignment-files' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE student_id = auth.uid()
        AND role = 'teacher'
    )
  );

-- Teachers can delete their assignment files
CREATE POLICY "Teachers can delete assignment files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'assignment-files' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE student_id = auth.uid()
        AND role = 'teacher'
    )
  );

-- All authenticated users can view assignment files
CREATE POLICY "Authenticated users can view assignment files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'assignment-files' AND auth.role() = 'authenticated');

-- Create storage bucket for student submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-files', 'submission-files', false)
ON CONFLICT (id) DO NOTHING;

-- Students can upload their submission files
CREATE POLICY "Students can upload submission files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can update their submission files
CREATE POLICY "Students can update submission files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'submission-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can delete their submission files
CREATE POLICY "Students can delete submission files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'submission-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- TAs and teachers can view submission files
CREATE POLICY "TAs can view submission files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'submission-files' AND
    auth.role() = 'authenticated'
  );