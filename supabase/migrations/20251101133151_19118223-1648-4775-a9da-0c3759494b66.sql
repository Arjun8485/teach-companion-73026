-- Fix infinite recursion in user_roles RLS policy
-- Create a security definer function to check if user has any role in a course
CREATE OR REPLACE FUNCTION public.user_has_course_access(_student_id uuid, _course_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE student_id = _student_id
      AND course_code = _course_code
  )
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Authenticated users can view roles in their courses" ON public.user_roles;

-- Create new policy using the security definer function
CREATE POLICY "Authenticated users can view roles in their courses"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.user_has_course_access(auth.uid(), course_code)
);