-- Fix Critical Security Issues
-- 1. Restrict student table access to authenticated users only
-- 2. Fix user_roles privilege escalation vulnerability

-- ============================================
-- FIX 1: Student PII Protection
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Students are viewable by everyone" ON public.students;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view students"
ON public.students
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- FIX 2: User Roles Authorization Bypass
-- ============================================

-- Drop the dangerous policies that allow anyone to manipulate roles
DROP POLICY IF EXISTS "Anyone can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can remove roles" ON public.user_roles;

-- Create restricted policies: Only teachers can manage roles in their courses
CREATE POLICY "Teachers can assign roles in their courses"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher', course_code)
);

CREATE POLICY "Teachers can remove roles in their courses"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher', course_code)
);

-- Keep the existing SELECT policy but ensure it's for authenticated users
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles in their courses"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  -- Users can see roles in courses where they have any role
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.student_id = auth.uid()
    AND ur.course_code = user_roles.course_code
  )
);