
-- Migration: 20251101110536
-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE,
  course_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create enum for user roles (only TA for now)
CREATE TYPE public.app_role AS ENUM ('ta');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'ta',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_code)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check if a student is a TA
CREATE OR REPLACE FUNCTION public.is_ta(_student_id UUID, _course_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE student_id = _student_id
      AND course_code = _course_code
      AND role = 'ta'
  )
$$;

-- RLS Policies for students table (publicly readable for listing)
CREATE POLICY "Students are viewable by everyone"
ON public.students
FOR SELECT
USING (true);

-- RLS Policies for user_roles table (publicly readable to see TA status)
CREATE POLICY "User roles are viewable by everyone"
ON public.user_roles
FOR SELECT
USING (true);

-- Allow anyone to insert roles (teacher functionality)
CREATE POLICY "Anyone can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- Allow anyone to delete roles (teacher functionality)
CREATE POLICY "Anyone can remove roles"
ON public.user_roles
FOR DELETE
USING (true);

-- Insert some sample students for Engineering Physics course
INSERT INTO public.students (name, email, student_id, course_code) VALUES
  ('Emma Korhonen', 'emma.korhonen@student.lut.fi', 'S001', 'PHYS101'),
  ('Ville Järvinen', 'ville.jarvinen@student.lut.fi', 'S002', 'PHYS101'),
  ('Sofia Virtanen', 'sofia.virtanen@student.lut.fi', 'S003', 'PHYS101'),
  ('Mikko Nieminen', 'mikko.nieminen@student.lut.fi', 'S004', 'PHYS101'),
  ('Anna Koskinen', 'anna.koskinen@student.lut.fi', 'S005', 'PHYS101'),
  ('Jani Mäkinen', 'jani.makinen@student.lut.fi', 'S006', 'PHYS101'),
  ('Laura Salminen', 'laura.salminen@student.lut.fi', 'S007', 'PHYS101'),
  ('Petri Laine', 'petri.laine@student.lut.fi', 'S008', 'PHYS101');

-- Migration: 20251101113624
-- Update the app_role enum to include all roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone (authenticated)
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_student_id uuid, _course_code text)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE student_id = _student_id
    AND course_code = _course_code
  LIMIT 1
$$;

-- Create a function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_student_id uuid, _role app_role, _course_code text)
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
      AND role = _role
      AND course_code = _course_code
  )
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251101114245
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

-- Migration: 20251101131959
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

-- Migration: 20251101133150
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

-- Migration: 20251101141008
-- Update the app_role enum to include all role types
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- Migration: 20251101143237
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
