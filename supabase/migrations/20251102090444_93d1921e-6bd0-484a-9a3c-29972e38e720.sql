-- Backfill student roles for existing enrollments
INSERT INTO public.user_roles (student_id, course_id, role)
SELECT DISTINCT 
  ce.student_id,
  ce.course_id,
  'student'::app_role
FROM public.course_enrollments ce
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_roles ur 
  WHERE ur.student_id = ce.student_id 
    AND ur.course_id = ce.course_id 
    AND ur.role = 'student'
)
ON CONFLICT DO NOTHING;