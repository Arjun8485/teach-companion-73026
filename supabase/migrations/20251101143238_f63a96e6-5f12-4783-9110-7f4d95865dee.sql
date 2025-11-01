-- Drop existing policies that depend on course_code
DROP POLICY IF EXISTS "Teachers can assign roles in their courses" ON public.user_roles;
DROP POLICY IF EXISTS "Teachers can remove roles in their courses" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles in their courses" ON public.user_roles;

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  dates text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all courses
CREATE POLICY "Authenticated users can view all courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- Allow teachers to manage courses
CREATE POLICY "Teachers can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE student_id = auth.uid() AND role = 'teacher'
  )
);

-- Insert existing course data
INSERT INTO public.courses (name, department, dates) VALUES
('Introduction to Programming', 'Computer Science', 'Fall 2024'),
('Data Structures & Algorithms', 'Computer Science', 'Fall 2024'),
('Database Systems', 'Computer Science', 'Spring 2025');

-- Add course_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Drop the students table
DROP TABLE IF EXISTS public.students CASCADE;

-- Drop old course_code column
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS course_code CASCADE;

-- Update constraints
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_student_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_student_id_course_id_role_key UNIQUE (student_id, course_id, role);

-- Recreate RLS policies with course_id
CREATE POLICY "Authenticated users can view roles in their courses"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can assign roles in their courses"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.student_id = auth.uid() 
      AND ur.role = 'teacher'
      AND ur.course_id = user_roles.course_id
  )
);

CREATE POLICY "Teachers can remove roles in their courses"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.student_id = auth.uid() 
      AND ur.role = 'teacher'
      AND ur.course_id = user_roles.course_id
  )
);

-- Update helper functions
DROP FUNCTION IF EXISTS public.user_has_course_access(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role, text);
DROP FUNCTION IF EXISTS public.get_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_ta(uuid, text);

CREATE OR REPLACE FUNCTION public.has_role(_student_id uuid, _role app_role, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE student_id = _student_id
      AND role = _role
      AND course_id = _course_id
  )
$$;