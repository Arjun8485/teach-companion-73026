-- Create exercise_sessions table
CREATE TABLE public.exercise_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  created_by uuid NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_day_of_week integer,
  recurrence_time time,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create session_attendance table
CREATE TABLE public.session_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  verification_token text NOT NULL,
  UNIQUE(session_id, student_id)
);

-- Enable RLS
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_sessions
CREATE POLICY "Users can view sessions in their courses"
  ON public.exercise_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE student_id = auth.uid()
      AND course_id = exercise_sessions.course_id
    )
  );

CREATE POLICY "Teachers can create sessions"
  ON public.exercise_sessions
  FOR INSERT
  WITH CHECK (
    is_teacher_for_course(auth.uid(), course_id)
  );

CREATE POLICY "Teachers can update sessions"
  ON public.exercise_sessions
  FOR UPDATE
  USING (
    is_teacher_for_course(auth.uid(), course_id)
  );

CREATE POLICY "Teachers can delete sessions"
  ON public.exercise_sessions
  FOR DELETE
  USING (
    is_teacher_for_course(auth.uid(), course_id)
  );

-- RLS Policies for session_attendance
CREATE POLICY "Students can view their own attendance"
  ON public.session_attendance
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view all attendance in their courses"
  ON public.session_attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.exercise_sessions es
      WHERE es.id = session_attendance.session_id
      AND is_teacher_for_course(auth.uid(), es.course_id)
    )
  );

CREATE POLICY "Students can record their own attendance"
  ON public.session_attendance
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_session_attendance_session ON public.session_attendance(session_id);
CREATE INDEX idx_session_attendance_student ON public.session_attendance(student_id);
CREATE INDEX idx_exercise_sessions_course ON public.exercise_sessions(course_id);
CREATE INDEX idx_exercise_sessions_scheduled ON public.exercise_sessions(scheduled_at);