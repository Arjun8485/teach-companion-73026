-- Drop the restrictive policy that only allows users with user_roles entries
DROP POLICY IF EXISTS "Users can view course assignments" ON assignments;

-- Create a new policy that allows any authenticated user to view assignments
-- This assumes that if a user can access the course page, they should see assignments
CREATE POLICY "Authenticated users can view assignments"
ON assignments
FOR SELECT
TO authenticated
USING (true);

-- Alternatively, if you want to restrict to only users enrolled in courses:
-- CREATE POLICY "Enrolled users can view assignments"
-- ON assignments
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_roles.student_id = auth.uid()
--     AND user_roles.course_id = assignments.course_id
--   )
-- );