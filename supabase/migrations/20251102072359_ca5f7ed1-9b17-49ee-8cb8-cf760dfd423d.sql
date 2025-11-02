-- Update RLS policies to allow TAs to manage exercise sessions

DROP POLICY IF EXISTS "Teachers can create sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Teachers can update sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Teachers can delete sessions" ON exercise_sessions;

-- Create new policies that allow both teachers and TAs
CREATE POLICY "Teachers and TAs can create sessions"
ON exercise_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
      AND course_id = exercise_sessions.course_id
      AND role IN ('teacher', 'ta')
  )
);

CREATE POLICY "Teachers and TAs can update sessions"
ON exercise_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
      AND course_id = exercise_sessions.course_id
      AND role IN ('teacher', 'ta')
  )
);

CREATE POLICY "Teachers and TAs can delete sessions"
ON exercise_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE student_id = auth.uid()
      AND course_id = exercise_sessions.course_id
      AND role IN ('teacher', 'ta')
  )
);