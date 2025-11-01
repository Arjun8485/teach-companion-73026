import { ReactNode, useState } from "react";
import { Bell, MessageSquare, User, ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
}

const courses: Course[] = [
  { id: "1", name: "Engineering Mechanics I", code: "BK80A4000", department: "Mechanical Engineering" },
  { id: "2", name: "Finnish 2", code: "K200CE70-3134", department: "Language studies" },
  { id: "3", name: "Mathematics 1", code: "MAT101", department: "Mathematics" },
  { id: "4", name: "Engineering Physics", code: "PHY201", department: "Physics" },
  { id: "5", name: "Sustainability in Practice", code: "SUS301", department: "Other courses" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  selectedCourse?: string;
  onCourseSelect?: (courseId: string) => void;
}

export default function DashboardLayout({ children, selectedCourse, onCourseSelect }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">LUT University</span>
                <span className="text-xs text-muted-foreground">Teacher Dashboard</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Home
            </Button>
            <Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              More
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-16 h-[calc(100vh-4rem)] border-r bg-card transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-72"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              {!sidebarCollapsed && (
                <h2 className="text-sm font-semibold text-foreground">My Courses</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8"
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform", !sidebarCollapsed && "rotate-180")} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect?.(course.id)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-all hover:bg-secondary",
                    selectedCourse === course.id && "bg-primary/10 border border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                      selectedCourse === course.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          selectedCourse === course.id ? "text-primary" : "text-foreground"
                        )}>
                          {course.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{course.code}</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
