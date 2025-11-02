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
  isTA?: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  selectedCourse?: string;
  onCourseSelect?: (courseId: string) => void;
  userType?: 'student' | 'teacher';
}

export default function DashboardLayout({ children, selectedCourse, onCourseSelect, userType = 'student' }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadCourses();
  }, [userType]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      setUserName(profile?.full_name || profile?.email || 'User');
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userType === 'teacher') {
        // For teachers, fetch courses they're responsible for
        const { data: teacherCourses, error: teacherError } = await supabase
          .from('teacher_courses')
          .select(`
            course_id,
            courses (
              id,
              name,
              department
            )
          `)
          .eq('teacher_id', user.id);

        if (teacherError) throw teacherError;

        const coursesData = teacherCourses?.map(tc => ({
          id: tc.courses.id,
          name: tc.courses.name,
          department: tc.courses.department,
          isTA: false
        })) || [];

        setCourses(coursesData);
      } else {
        // For students, fetch enrolled courses
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select(`
            course_id,
            courses (
              id,
              name,
              department
            )
          `)
          .eq('student_id', user.id);

        if (enrollmentError) throw enrollmentError;

        // Get user's TA roles
        const { data: taRoles, error: taError } = await supabase
          .from('user_roles')
          .select('course_id')
          .eq('student_id', user.id)
          .eq('role', 'ta');

        if (taError) throw taError;

        const taCourseIds = new Set(taRoles?.map(r => r.course_id) || []);

        const coursesData = enrollments?.map(enrollment => ({
          id: enrollment.courses.id,
          name: enrollment.courses.name,
          department: enrollment.courses.department,
          isTA: taCourseIds.has(enrollment.courses.id)
        })) || [];

        setCourses(coursesData);
      }
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
        <div className="flex h-12 sm:h-14 2xl:h-16 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", mobileMenuOpen && "rotate-180")} />
            </Button>
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 2xl:h-7 2xl:w-7 text-primary flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm 2xl:text-base font-semibold text-foreground truncate">{userName}</span>
              <span className="text-[10px] sm:text-xs 2xl:text-sm text-muted-foreground truncate">
                {userType === 'teacher' ? "Teacher's Dashboard" : "Student Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 2xl:h-10 2xl:w-10 hover:bg-muted">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 2xl:h-10 2xl:w-10 hover:bg-muted">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 2xl:h-10 2xl:w-10 rounded-full hover:bg-muted">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-9 sm:w-9 2xl:h-10 2xl:w-10 hover:bg-muted" title="Log out">
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full relative">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Clean Sidebar */}
        <aside
          className={cn(
            "border-r bg-background transition-all duration-200",
            "lg:sticky lg:top-14 2xl:top-16 lg:h-[calc(100vh-3.5rem)] 2xl:h-[calc(100vh-4rem)]",
            // Mobile styles
            "fixed top-12 sm:top-14 h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] z-50",
            "lg:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop width control
            sidebarCollapsed ? "w-14 lg:w-16 2xl:w-20" : "w-64 sm:w-72 lg:w-64 2xl:w-80"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 pb-3">
              {!sidebarCollapsed && (
                <h2 className="text-xs 2xl:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Courses</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-7 w-7 2xl:h-8 2xl:w-8 hover:bg-muted hidden lg:flex"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform", !sidebarCollapsed && "rotate-180")} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 sm:px-3 space-y-1">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    onCourseSelect?.(course.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md px-2 sm:px-2.5 py-2 2xl:py-3 text-left transition-all",
                    selectedCourse === course.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className={cn(
                      "flex flex-shrink-0 items-center justify-center rounded-md",
                      "h-6 w-6 2xl:h-7 2xl:w-7",
                      selectedCourse === course.id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <GraduationCap className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm 2xl:text-base font-medium truncate">
                            {course.name}
                          </p>
                          {course.isTA && (
                            <span className="text-[10px] 2xl:text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded whitespace-nowrap">TA</span>
                          )}
                        </div>
                        <p className="text-xs 2xl:text-sm text-muted-foreground truncate">{course.department}</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
