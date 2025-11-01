-- Allow teachers to view all role assignments for their courses
-- This is needed so teachers can see TA badges and manage roles

-- Create security definer function to check if user is a teacher for a course
CREATE OR REPLACE FUNCTION public.is_teacher_for_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE student_id = _user_id
      AND course_id = _course_id
      AND role = 'teacher'
  )
$$;

-- Add policy allowing teachers to view all roles in courses they teach
CREATE POLICY "Teachers can view all roles in their courses" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  public.is_teacher_for_course(auth.uid(), course_id)
);