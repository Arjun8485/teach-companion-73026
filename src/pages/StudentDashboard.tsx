import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import CourseDetailView from "@/components/CourseDetailView";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
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

    setLoading(false);
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
