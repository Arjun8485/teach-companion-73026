-- Create trigger to automatically assign student role on enrollment
CREATE OR REPLACE FUNCTION public.handle_course_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert student role if it doesn't exist
  INSERT INTO public.user_roles (student_id, course_id, role)
  VALUES (NEW.student_id, NEW.course_id, 'student'::app_role)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on course_enrollments
DROP TRIGGER IF EXISTS on_course_enrollment ON public.course_enrollments;
CREATE TRIGGER on_course_enrollment
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_course_enrollment();