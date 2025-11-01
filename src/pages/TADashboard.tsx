import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, BookOpen, Users, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

interface ProfileInfo {
  email: string;
  full_name: string | null;
}

interface TARole {
  course_code: string;
}

export default function TADashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [taCourses, setTACourses] = useState<TARole[]>([]);

  useEffect(() => {
    if (user) {
      loadTAData();
    }
  }, [user]);

  const loadTAData = async () => {
    try {
      setLoading(true);

      // Fetch profile info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Check if user is a TA in any course
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("course_code")
        .eq("student_id", user?.id);

      if (rolesError) throw rolesError;

      if (rolesData) {
        setTACourses(rolesData);
      }
    } catch (error) {
      console.error("Error loading TA data:", error);
      toast.error("Failed to load TA data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading TA dashboard...</p>
        </div>
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
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        {profile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{profile.full_name || 'TA User'}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
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
