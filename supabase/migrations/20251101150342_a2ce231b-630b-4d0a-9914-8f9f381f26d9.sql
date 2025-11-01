-- Fix Critical Security Issue #1: Restrict profiles table access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Allow users to view profiles of people in their courses
-- This is needed for displaying student/TA names in course views
CREATE POLICY "Users can view profiles in their courses" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT DISTINCT ur.student_id 
    FROM user_roles ur
    WHERE ur.course_id IN (
      SELECT course_id 
      FROM user_roles 
      WHERE student_id = auth.uid()
    )
  )
);

-- Add INSERT policy for completeness (even though trigger handles this)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix Critical Security Issue #2: Restrict user_roles table access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view roles in their courses" ON public.user_roles;

-- Allow users to view roles only for courses they're enrolled in
CREATE POLICY "Users can view roles for their courses" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  course_id IN (
    SELECT course_id 
    FROM user_roles 
    WHERE student_id = auth.uid()
  )
);