import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import StudentTAList from "@/components/StudentTAList";

export default function TADashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
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

      // Check if user has TA role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('student_id', session.user.id);

      if (error) throw error;

      const hasTA = roles?.some((r: any) => r.role === 'ta');
      const hasTeacher = roles?.some((r: any) => r.role === 'teacher');

      if (!hasTA && !hasTeacher) {
        toast.error("Access denied: TA or Teacher role required");
        navigate("/");
        return;
      }

      setUserRole(hasTeacher ? 'teacher' : 'ta');
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
        <p className="text-muted-foreground">Loading TA Dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {userRole === 'teacher' ? 'Teacher' : 'TA'} Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage course materials, grade assignments, and assist students
          </p>
        </div>

        {/* Course Management Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Assigned Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/40 bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">Engineering Mechanics I</h3>
              <p className="text-sm text-muted-foreground mb-4">BK80A4000</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Materials</Button>
                <Button size="sm" variant="outline">Gradebook</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Student List Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
          {/* StudentTAList will be updated once we have course selection */}
          <Card>
            <CardHeader>
              <CardTitle>TA Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Select a course to manage TAs</p>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <span className="text-2xl">📝</span>
              <span>Grade Assignments</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <span className="text-2xl">📊</span>
              <span>View Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <span className="text-2xl">💬</span>
              <span>Message Students</span>
            </Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
