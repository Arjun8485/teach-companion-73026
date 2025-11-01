-- Fix the infinite recursion between profiles and user_roles tables
-- The issue: profiles RLS policy queries user_roles, but user_roles has FK to profiles
-- This creates: user_roles query → FK check on profiles → profiles RLS queries user_roles → infinite loop

-- Step 1: Create security definer function to check if users share a course
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.users_share_course(_user_id1 uuid, _user_id2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur1
    JOIN user_roles ur2 ON ur1.course_id = ur2.course_id
    WHERE ur1.student_id = _user_id1
      AND ur2.student_id = _user_id2
  )
$$;

-- Step 2: Drop the problematic recursive policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their courses" ON public.profiles;

-- Step 3: Create new policy using the security definer function
CREATE POLICY "Users can view profiles in their courses" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can see their own profile OR profiles of users they share a course with
  auth.uid() = id 
  OR public.users_share_course(auth.uid(), id)
);