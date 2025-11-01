import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, BookOpen, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  student_id: string;
}

interface TARole {
  course_code: string;
}

export default function TADashboard() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [taCourses, setTACourses] = useState<TARole[]>([]);
  const [isTA, setIsTA] = useState(false);

  useEffect(() => {
    if (studentId) {
      checkTAStatus();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const checkTAStatus = async () => {
    try {
      setLoading(true);

      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Check if student is a TA in any course
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("course_code")
        .eq("student_id", studentId);

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        setIsTA(true);
        setTACourses(rolesData);
      } else {
        setIsTA(false);
      }
    } catch (error) {
      console.error("Error checking TA status:", error);
      toast.error("Failed to verify TA status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Required
            </CardTitle>
            <CardDescription>
              Please provide a valid student ID to access the TA dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isTA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You are not assigned as a Teaching Assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {student && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.email}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">ID: {student.student_id}</p>
              </div>
            )}
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              TA Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your teaching assistant responsibilities</p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Student Info */}
        {student && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <p className="text-sm font-mono text-muted-foreground">Student ID: {student.student_id}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Shield className="h-3 w-3 mr-1" />
                  Teaching Assistant
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TA Courses */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Assigned Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taCourses.map((course) => (
                  <div
                    key={course.course_code}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30"
                  >
                    <span className="font-medium text-foreground">{course.course_code}</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{taCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Courses Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coming Soon</CardTitle>
              <CardDescription>More TA features in development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Additional features for grading, attendance, and student management will be added soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
