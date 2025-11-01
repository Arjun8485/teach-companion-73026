-- Create assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can create assignments for courses they teach
CREATE POLICY "Teachers can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_teacher_for_course(auth.uid(), course_id)
);

-- All authenticated users can view assignments for courses they're enrolled in
CREATE POLICY "Users can view course assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.student_id = auth.uid()
      AND user_roles.course_id = assignments.course_id
  )
);