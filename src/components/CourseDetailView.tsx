import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import StudentTAList from "./StudentTAList";
import StudentAssignmentView from "./StudentAssignmentView";
import TeacherAssignmentCreate from "./TeacherAssignmentCreate";
import TAGradingView from "./TAGradingView";
import ExerciseSessionManager from "./ExerciseSessionManager";
import StudentQRScanner from "./StudentQRScanner";
import { useCourseAnalytics } from "@/hooks/useCourseAnalytics";
import AssignmentAnalytics from "./AssignmentAnalytics";
import { BarChart3, Users, FileText, CheckCircle2, ArrowLeft, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseDetailViewProps {
  courseId: string;
  isTA: boolean; // true = teacher/TA with full access, false = student with limited access
  isTeacher?: boolean; // true = teacher (can manage roles), false/undefined = TA or student
  onBack: () => void;
}

export default function CourseDetailView({ courseId, isTA, isTeacher, onBack }: CourseDetailViewProps) {
  const [activeTab, setActiveTab] = useState(isTA ? "analysis" : "assignments");
  const [course, setCourse] = useState<{ name: string; department: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentKey, setAssignmentKey] = useState(0);
  const { toast } = useToast();
  const analytics = useCourseAnalytics(courseId);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('name, department')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentCreated = () => {
    setAssignmentKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{course.name}</h1>
        <p className="text-sm text-muted-foreground">{course.department}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 gap-1">
          {isTA && (
            <TabsTrigger value="analysis" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Analysis
            </TabsTrigger>
          )}
          <TabsTrigger value="assignments" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Assignments
          </TabsTrigger>
          {isTeacher && (
            <TabsTrigger value="roles" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Roles
            </TabsTrigger>
          )}
          <TabsTrigger value="exercises" className="gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Exercises
          </TabsTrigger>
        </TabsList>

        {isTA && (
          <TabsContent value="analysis" className="space-y-6 mt-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Students"
              value={analytics.loading ? "..." : analytics.totalStudents.toString()}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Avg Attendance"
              value={analytics.loading ? "..." : `${analytics.avgAttendance}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              title="Assignments Completed"
              value={analytics.loading ? "..." : `${analytics.assignmentsCompleted}%`}
              icon={<FileText className="h-4 w-4" />}
            />
            <StatCard
              title="Upcoming Deadlines"
              value={analytics.loading ? "..." : analytics.upcomingDeadlines.toString()}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          <AssignmentAnalytics 
            assignments={analytics.assignmentDetails} 
            totalStudents={analytics.totalStudents}
          />

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Student Engagement Overview</CardTitle>
              <CardDescription className="text-sm">Real-time insights on class participation and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Total Enrolled</p>
                  <p className="text-xs text-muted-foreground">Students in this course</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {analytics.loading ? "..." : `${analytics.totalStudents} students`}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Assignment Submission Rate</p>
                  <p className="text-xs text-muted-foreground">Overall completion percentage</p>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">
                  {analytics.loading ? "..." : `${analytics.assignmentsCompleted}%`}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Attendance Rate</p>
                  <p className="text-xs text-muted-foreground">Exercise session attendance</p>
                </div>
                <Badge variant="secondary" className="bg-muted">
                  {analytics.loading ? "..." : `${analytics.avgAttendance}%`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="assignments" className="space-y-6 mt-8">
          {isTeacher ? (
            <>
              <TeacherAssignmentCreate courseId={courseId} onSuccess={handleAssignmentCreated} />
              <TAGradingView key={assignmentKey} courseId={courseId} isTeacher={true} />
            </>
          ) : isTA ? (
            <TAGradingView key={assignmentKey} courseId={courseId} />
          ) : (
            <StudentAssignmentView key={assignmentKey} courseId={courseId} />
          )}
        </TabsContent>

        {isTeacher && (
          <TabsContent value="roles" className="space-y-6 mt-8">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Teaching Assistant Assignment</CardTitle>
              <CardDescription className="text-sm">Select students to assign as TAs for this course</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentTAList courseCode={courseId} />
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="exercises" className="space-y-6 mt-8">
          {isTA ? (
            <ExerciseSessionManager courseId={courseId} />
          ) : (
            <StudentQRScanner courseId={courseId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
