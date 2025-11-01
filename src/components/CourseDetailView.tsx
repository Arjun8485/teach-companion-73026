import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import StudentTAList from "./StudentTAList";
import { BarChart3, Users, FileText, CheckCircle2, Upload, QrCode, TrendingUp, ArrowLeft } from "lucide-react";

interface CourseDetailViewProps {
  courseId: string;
  isTA: boolean;
  onBack: () => void;
}

export default function CourseDetailView({ courseId, isTA, onBack }: CourseDetailViewProps) {
  const [activeTab, setActiveTab] = useState(isTA ? "analysis" : "assignments");
  const [course, setCourse] = useState<{ name: string; department: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
          {isTA && (
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
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Create New Assignment</CardTitle>
              <CardDescription className="text-sm">Publish exercises and upload solution files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment Title</label>
                <Input placeholder="e.g., Problem Set 3: Dynamics" className="h-10 border-border/40" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <Textarea placeholder="Describe the assignment objectives and requirements..." rows={4} className="border-border/40" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                <Input type="date" className="h-10 border-border/40" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upload Files</label>
                <Button variant="outline" className="w-full h-10 border-border/40 hover:bg-muted">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PDF, Images, or Videos
                </Button>
              </div>
              <Button className="w-full h-10">Publish Assignment</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isTA && (
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
