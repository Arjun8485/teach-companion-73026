import { ReactNode, useState, useEffect } from "react";
import { Bell, MessageSquare, User, ChevronRight, GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  department: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  selectedCourse?: string;
  onCourseSelect?: (courseId: string) => void;
}

export default function DashboardLayout({ children, selectedCourse, onCourseSelect }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, department')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">LUT Teacher</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 hover:bg-muted" title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Clean Sidebar */}
        <aside
          className={cn(
            "sticky top-14 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-200",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4 pb-3">
              {!sidebarCollapsed && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Courses</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-7 w-7 hover:bg-muted"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", !sidebarCollapsed && "rotate-180")} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect?.(course.id)}
                  className={cn(
                    "w-full rounded-md px-2.5 py-2 text-left transition-all",
                    selectedCourse === course.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md",
                      selectedCourse === course.id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <GraduationCap className="h-3.5 w-3.5" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{course.department}</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
