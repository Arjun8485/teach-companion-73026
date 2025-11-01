import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, UserCheck } from "lucide-react";

interface CourseEnrollment {
  id: string;
  name: string;
  department: string;
  dates: string;
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
      // Get all courses (students are automatically enrolled in all)
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*');

      if (coursesError) throw coursesError;

      // Get TA roles for this user
      const { data: taRoles, error: taError } = await supabase
        .from('user_roles')
        .select('course_id')
        .eq('student_id', userId)
        .eq('role', 'ta');

      if (taError) throw taError;

      // Combine the data
      const taCourseIds = new Set(taRoles?.map(r => r.course_id) || []);
      
      const enrollments: CourseEnrollment[] = (allCourses || []).map(course => ({
        id: course.id,
        name: course.name,
        department: course.department,
        dates: course.dates || '',
        is_ta: taCourseIds.has(course.id)
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
              <Card key={course.id} className="border-border/40 hover:border-primary/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{course.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{course.department}</p>
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
