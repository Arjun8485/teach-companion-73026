import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import CourseDetailView from "@/components/CourseDetailView";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function TADashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkTAAccess();
  }, []);

  const checkTAAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has TA or Teacher role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('student_id', session.user.id);

      if (error) throw error;

      const hasTA = roles?.some((r: any) => r.role === 'ta');
      const hasTeacher = roles?.some((r: any) => r.role === 'teacher');

      if (!hasTA && !hasTeacher) {
        toast.error("Access denied: TA or Teacher role required");
        navigate("/student");
        return;
      }

      setIsTeacher(hasTeacher);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking TA access:', error);
      toast.error("Failed to verify access");
      navigate("/auth");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout 
      selectedCourse={selectedCourse || undefined} 
      onCourseSelect={setSelectedCourse}
      userType="teacher"
    >
      {selectedCourse ? (
        <CourseDetailView 
          courseId={selectedCourse}
          isTA={true}
          isTeacher={isTeacher}
          onBack={() => setSelectedCourse(null)}
        />
      ) : (
        <div className="p-4 sm:p-6 2xl:p-8 max-w-7xl 2xl:max-w-[1600px] mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-foreground mb-2">
              {isTeacher ? "Teacher's Dashboard" : "TA Dashboard"}
            </h1>
            <p className="text-sm sm:text-base 2xl:text-lg text-muted-foreground">
              Select a course from the sidebar to manage materials, assignments, and students
            </p>
          </div>
          <Card>
            <CardContent className="p-8 sm:p-12 2xl:p-16 text-center">
              <p className="text-sm sm:text-base 2xl:text-lg text-muted-foreground">Select a course from the sidebar to get started</p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
