import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import CourseDetailView from "@/components/CourseDetailView";
import { Card, CardContent } from "@/components/ui/card";

interface UserCourseRole {
  [courseId: string]: 'teacher' | 'ta' | 'student';
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserCourseRole>({});
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

    // Check if user is a teacher - if so, redirect to teacher dashboard
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('student_id', session.user.id);

    const hasTeacher = roles?.some((r: any) => r.role === 'teacher');
    
    if (hasTeacher) {
      navigate("/ta");
      return;
    }

    await loadUserRoles(session.user.id);
    setLoading(false);
  };

  const loadUserRoles = async (userId: string) => {
    try {
      const { data: allRoles, error } = await supabase
        .from('user_roles')
        .select('course_id, role')
        .eq('student_id', userId);

      if (error) throw error;

      const rolesMap: UserCourseRole = {};
      allRoles?.forEach(role => {
        // Prioritize teacher > ta > student
        if (role.role === 'teacher') {
          rolesMap[role.course_id] = 'teacher';
        } else if (role.role === 'ta' && rolesMap[role.course_id] !== 'teacher') {
          rolesMap[role.course_id] = 'ta';
        } else if (!rolesMap[role.course_id]) {
          rolesMap[role.course_id] = 'student';
        }
      });

      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error loading user roles:', error);
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
    <DashboardLayout selectedCourse={selectedCourse || undefined} onCourseSelect={setSelectedCourse}>
      {selectedCourse ? (
        <CourseDetailView 
          courseId={selectedCourse}
          isTA={userRoles[selectedCourse] === 'ta' || userRoles[selectedCourse] === 'teacher'}
          isTeacher={userRoles[selectedCourse] === 'teacher'}
          onBack={() => setSelectedCourse(null)}
        />
      ) : (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Your Dashboard</h1>
            <p className="text-muted-foreground">Select a course from the sidebar to view details and assignments</p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Select a course from the sidebar to get started</p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
