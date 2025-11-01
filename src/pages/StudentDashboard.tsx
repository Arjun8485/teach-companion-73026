import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, UserCheck } from "lucide-react";

interface CourseEnrollment {
  course_code: string;
  course_name: string;
  is_ta: boolean;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseEnrollment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadCourses(session.user.id);
  };

  const loadCourses = async (userId: string) => {
    try {
      // Get courses where student is enrolled
      const { data: studentCourses, error: studentError } = await supabase
        .from('students')
        .select('course_code, name')
        .eq('student_id', userId);

      if (studentError) throw studentError;

      // Get TA roles
      const { data: taRoles, error: taError } = await supabase
        .from('user_roles')
        .select('course_code')
        .eq('student_id', userId)
        .eq('role', 'ta');

      if (taError) throw taError;

      // Combine the data
      const taCourses = new Set(taRoles?.map(r => r.course_code) || []);
      
      const enrollments: CourseEnrollment[] = (studentCourses || []).map(course => ({
        course_code: course.course_code,
        course_name: course.name,
        is_ta: taCourses.has(course.course_code)
      }));

      setCourses(enrollments);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
          <p className="text-muted-foreground">View your enrolled courses and TA assignments</p>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">You are not enrolled in any courses yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.course_code} className="border-border/40 hover:border-primary/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{course.course_name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{course.course_code}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {course.is_ta && (
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Teaching Assistant
                    </Badge>
                  )}
                  {!course.is_ta && (
                    <Badge variant="outline" className="gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Student
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
