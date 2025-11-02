-- Create course_enrollments table for student enrollments
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create teacher_courses table for teacher course assignments
CREATE TABLE public.teacher_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, course_id)
);

-- Enable RLS on both tables
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_enrollments
CREATE POLICY "Students can view their own enrollments"
  ON public.course_enrollments
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments in their courses"
  ON public.course_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_courses
      WHERE teacher_id = auth.uid()
        AND teacher_courses.course_id = course_enrollments.course_id
    )
  );

-- RLS policies for teacher_courses
CREATE POLICY "Teachers can view their own course assignments"
  ON public.teacher_courses
  FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can view all teacher assignments in their courses"
  ON public.teacher_courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_courses tc
      WHERE tc.teacher_id = auth.uid()
        AND tc.course_id = teacher_courses.course_id
    )
  );