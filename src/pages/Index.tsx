import { useState } from "react";
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
        <div className="p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your courses.</p>
          </div>

          {/* Timeline Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Timeline</h2>
              <div className="flex items-center gap-3">
                <Button 
                  variant={filterOverdue ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterOverdue(!filterOverdue)}
                >
                  Overdue
                </Button>
                <Button variant="outline" size="sm">
                  Sort by dates
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by activity type or name"
                className="pl-10 h-12"
              />
            </div>

            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No activities require action</p>
            </div>
          </section>

          {/* Recently Accessed Courses */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Recently accessed courses</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <section className="mt-8">
            <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">🤖 AI Assistant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try natural language commands like "Show students who missed 2+ sessions" or "Create assignment for Math 1 due next Friday"
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ask me anything about your courses..."
                  className="flex-1"
                />
                <Button className="gap-2">
                  Ask AI
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div>
          <div className="border-b bg-card px-6 py-3">
            <Button variant="ghost" onClick={handleBackToDashboard} className="gap-2">
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
