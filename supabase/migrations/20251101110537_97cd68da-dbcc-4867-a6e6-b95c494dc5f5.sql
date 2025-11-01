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