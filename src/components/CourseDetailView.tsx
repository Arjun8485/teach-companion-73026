import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import StudentTAList from "./StudentTAList";
import { BarChart3, Users, FileText, CheckCircle2, Upload, QrCode, TrendingUp, ArrowLeft, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCourse();
    loadAssignments();
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

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, profiles:created_by(full_name)')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter an assignment title",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let fileUrl = null;

      // Upload file if present
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assignment-files')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const { error } = await supabase
        .from('assignments')
        .insert({
          course_id: courseId,
          title: assignmentTitle,
          description: assignmentDescription,
          due_date: assignmentDueDate || null,
          created_by: user.id,
          file_url: fileUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });

      loadAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    }
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
          {isTA && (
            <TabsTrigger value="ta-overview" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              TA Overview
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
              value="142"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              title="Avg Attendance"
              value="87%"
              icon={<CheckCircle2 className="h-4 w-4" />}
              trend={{ value: 3, positive: true }}
            />
            <StatCard
              title="Assignments Completed"
              value="94%"
              icon={<FileText className="h-4 w-4" />}
              trend={{ value: 5, positive: true }}
            />
            <StatCard
              title="AI Verification Accuracy"
              value="96%"
              icon={<BarChart3 className="h-4 w-4" />}
              trend={{ value: 2, positive: true }}
            />
          </div>

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Student Engagement Overview</CardTitle>
              <CardDescription className="text-sm">Real-time insights on class participation and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">High Performers</p>
                  <p className="text-xs text-muted-foreground">Students scoring above 90%</p>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">45 students</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Needs Attention</p>
                  <p className="text-xs text-muted-foreground">Students with 2+ missed sessions</p>
                </div>
                <Badge className="bg-warning/10 text-warning border-warning/20">12 students</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Average Completion Time</p>
                  <p className="text-xs text-muted-foreground">Time to complete assignments</p>
                </div>
                <Badge variant="secondary" className="bg-muted">2.4 days</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="assignments" className="space-y-6 mt-8">
          {isTeacher && (
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Create New Assignment</CardTitle>
                <CardDescription className="text-sm">Publish exercises for students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment Title</label>
                  <Input 
                    placeholder="e.g., Problem Set 3: Dynamics" 
                    className="h-10 border-border/40"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                  <Textarea 
                    placeholder="Describe the assignment objectives and requirements..." 
                    rows={4} 
                    className="border-border/40"
                    value={assignmentDescription}
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                  <Input 
                    type="date" 
                    className="h-10 border-border/40"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upload PDF (Optional)</label>
                  <div className="flex flex-col gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="h-10 border-border/40"
                    />
                    {uploadedFile && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {uploadedFile.name}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full h-10" 
                  onClick={handleCreateAssignment}
                  disabled={submitting}
                >
                  {submitting ? "Publishing..." : "Publish Assignment"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Assignments</CardTitle>
              <CardDescription className="text-sm">
                {assignments.length === 0 
                  ? "No assignments yet" 
                  : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No assignments have been created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className="flex items-start justify-between rounded-md border border-border/40 bg-card/50 p-4"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground mb-1">{assignment.title}</h4>
                        {assignment.description && (
                          <p className="text-xs text-muted-foreground mb-2">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          {assignment.due_date && (
                            <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                          )}
                          {assignment.profiles?.full_name && (
                            <>
                              <span>•</span>
                              <span>By: {assignment.profiles.full_name}</span>
                            </>
                          )}
                        </div>
                        {assignment.file_url && (
                          <a 
                            href={assignment.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            Download PDF
                          </a>
                        )}
                      </div>
                      {isTeacher && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="ml-2 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

        {isTA && (
          <TabsContent value="ta-overview" className="space-y-6 mt-8">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="TA Sessions"
              value="24"
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Avg Attendance"
              value="34"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              title="Completion Rate"
              value="91%"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">TA Session Analytics</CardTitle>
              <CardDescription className="text-sm">Detailed data for TA-led sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Session 1: Introduction</p>
                    <p className="text-xs text-muted-foreground">Monday 10:00-12:00 • Group A</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">38 students</p>
                    <p className="text-xs text-success">95% attended</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Session 2: Problem Solving</p>
                    <p className="text-xs text-muted-foreground">Tuesday 14:00-16:00 • Group B</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">32 students</p>
                    <p className="text-xs text-success">89% attended</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="exercises" className="space-y-6 mt-8">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Exercise Class Management</CardTitle>
              <CardDescription className="text-sm">QR code check-ins and AI homework verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 p-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">Generate Check-in QR Code</h4>
                  <p className="text-xs text-muted-foreground">Students scan to mark attendance</p>
                </div>
                <Button className="gap-2 h-9">
                  <QrCode className="h-4 w-4" />
                  Generate QR
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Homework Verification</h4>
                <div className="rounded-md border border-border/40 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Problem Set 2 - Group C</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">AI Ready</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">42 submissions pending verification</p>
                  <Button variant="outline" className="w-full h-9 border-border/40">Start AI Verification</Button>
                </div>
              </div>

              <div className="rounded-md bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm font-medium text-foreground mb-1">💡 AI Tip</p>
                <p className="text-xs text-muted-foreground">
                  AI verification has 96% accuracy for mathematical problems. Review flagged submissions manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
