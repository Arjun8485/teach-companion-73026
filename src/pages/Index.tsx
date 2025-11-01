import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import CourseCard from "@/components/CourseCard";
import CourseDetailView from "@/components/CourseDetailView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, FileCheck } from "lucide-react";

const recentCourses = [
  {
    id: "1",
    title: "Engineering Mechanics I - Blended teaching, in English, Lpr, Lahti",
    code: "BK80A4000",
    dates: "1.9.2025-12.12.2025",
    department: "Konetekniikka - Mechanical Engineering",
  },
  {
    id: "2",
    title: "Finnish 2",
    code: "K200CE70-3134",
    dates: "27.10.2025-14.12.2025",
    department: "Kieliopinnot / Language studies LUT",
  },
  {
    id: "3",
    title: "Sustainability in Practice / Käytännön kestävyystoimet",
    code: "SUS301",
    dates: "1.9.2025-15.12.2025",
    department: "Muut kurssit / Other courses - LUT",
  },
  {
    id: "4",
    title: "Materials - Blended teaching, Lpr",
    code: "BK10A5900",
    dates: "1.9.2025-12.12.2025",
    department: "Konetekniikka - Mechanical Engineering",
  },
];

const Index = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  const selectedCourseData = recentCourses.find(c => c.id === selectedCourse);

  return (
    <DashboardLayout selectedCourse={selectedCourse || undefined} onCourseSelect={handleCourseSelect}>
      {!selectedCourse ? (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening with your courses.</p>
          </div>

          {/* Timeline Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant={filterOverdue ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setFilterOverdue(!filterOverdue)}
                  className="h-8 text-xs"
                >
                  Overdue
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  Sort by dates
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by activity type or name"
                className="pl-10 h-10 border-border/40"
              />
            </div>

            <div className="flex flex-col items-center justify-center py-16 border border-border/40 rounded-lg bg-card/30">
              <FileCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No activities require action</p>
            </div>
          </section>

          {/* Recently Accessed Courses */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recently accessed courses</h2>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  code={course.code}
                  dates={course.dates}
                  department={course.department}
                  onClick={() => handleCourseSelect(course.id)}
                />
              ))}
            </div>
          </section>

          {/* Quick AI Assistant Prompt */}
          <section>
            <div className="rounded-lg border border-border/40 bg-muted/30 p-6">
              <h3 className="text-base font-medium text-foreground mb-2 flex items-center gap-2">
                <span>🤖</span>
                <span>AI Assistant</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try natural language commands like "Show students who missed 2+ sessions" or "Create assignment for Math 1 due next Friday"
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ask me anything about your courses..."
                  className="flex-1 h-10 border-border/40"
                />
                <Button className="h-10 px-4">
                  Ask AI
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div>
          <div className="border-b border-border/40 bg-background px-8 py-4">
            <Button variant="ghost" onClick={handleBackToDashboard} className="gap-2 h-9 text-sm -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <CourseDetailView
            courseName={selectedCourseData?.title || ""}
            courseCode={selectedCourseData?.code || ""}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
