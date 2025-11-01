-- Fix user_roles foreign key constraint
-- Drop the incorrect foreign key if it exists
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_student_id_fkey;

-- Add correct foreign key to profiles table
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;