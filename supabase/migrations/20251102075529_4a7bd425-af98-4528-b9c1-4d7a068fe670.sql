-- Fix infinite recursion in teacher_courses and course_enrollments RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Teachers can view all teacher assignments in their courses" ON public.teacher_courses;
DROP POLICY IF EXISTS "Teachers can view their own course assignments" ON public.teacher_courses;
DROP POLICY IF EXISTS "Teachers can view enrollments in their courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;

-- Create simplified policies for teacher_courses
CREATE POLICY "Teachers can view their own course assignments" 
ON public.teacher_courses 
FOR SELECT 
USING (teacher_id = auth.uid());

-- Create simplified policies for course_enrollments  
CREATE POLICY "Students can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (student_id = auth.uid());

-- Allow teachers to view enrollments in courses they teach
CREATE POLICY "Teachers can view enrollments in their courses" 
ON public.course_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM teacher_courses tc
    WHERE tc.teacher_id = auth.uid() 
      AND tc.course_id = course_enrollments.course_id
  )
);