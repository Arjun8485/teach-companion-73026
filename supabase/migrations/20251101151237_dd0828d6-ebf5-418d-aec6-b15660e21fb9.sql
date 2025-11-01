-- Fix infinite recursion in user_roles policy
-- The previous policy was referencing user_roles within itself, causing recursion

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view roles for their courses" ON public.user_roles;

-- Create a simple non-recursive policy that allows users to see their own roles
-- This is sufficient for the current application needs
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (student_id = auth.uid());

-- If teachers need to see roles of students in their courses, we'll need to add
-- an additional policy using a security definer function (similar to has_role)
-- But for now, this simple policy fixes the recursion and unblocks the app