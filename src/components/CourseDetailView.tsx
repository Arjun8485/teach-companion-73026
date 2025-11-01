import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import { BarChart3, Users, FileText, CheckCircle2, Upload, QrCode, TrendingUp } from "lucide-react";

interface CourseDetailViewProps {
  courseName: string;
  courseCode: string;
}

export default function CourseDetailView({ courseName, courseCode }: CourseDetailViewProps) {
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div className="space-y-6">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">{courseName}</h1>
        <p className="text-sm text-muted-foreground">{courseCode}</p>
      </div>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <FileText className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Users className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="ta-overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              TA Overview
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Exercises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6 mt-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Overview</CardTitle>
                <CardDescription>Real-time insights on class participation and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-foreground">High Performers</p>
                    <p className="text-sm text-muted-foreground">Students scoring above 90%</p>
                  </div>
                  <Badge className="bg-success text-success-foreground">45 students</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-foreground">Needs Attention</p>
                    <p className="text-sm text-muted-foreground">Students with 2+ missed sessions</p>
                  </div>
                  <Badge className="bg-warning text-warning-foreground">12 students</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-foreground">Average Completion Time</p>
                    <p className="text-sm text-muted-foreground">Time to complete assignments</p>
                  </div>
                  <Badge variant="secondary">2.4 days</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Assignment</CardTitle>
                <CardDescription>Publish exercises and upload solution files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Assignment Title</label>
                  <Input placeholder="e.g., Problem Set 3: Dynamics" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea placeholder="Describe the assignment objectives and requirements..." rows={4} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Due Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Upload Files</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload PDF, Images, or Videos
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Publish Assignment</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Course Team</CardTitle>
                <CardDescription>Add TAs, instructors, and manage permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <Input placeholder="ta@lut.fi" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Teaching Assistant</option>
                    <option>Co-Instructor</option>
                    <option>Grader</option>
                  </select>
                </div>
                <Button className="w-full">Add Team Member</Button>

                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Current Team</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-foreground">Anna Virtanen</p>
                        <p className="text-sm text-muted-foreground">Teaching Assistant</p>
                      </div>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-foreground">Mikko Järvinen</p>
                        <p className="text-sm text-muted-foreground">Co-Instructor</p>
                      </div>
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ta-overview" className="space-y-6 mt-6">
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

            <Card>
              <CardHeader>
                <CardTitle>TA Session Analytics</CardTitle>
                <CardDescription>Detailed data for TA-led sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-foreground">Session 1: Introduction</p>
                      <p className="text-sm text-muted-foreground">Monday 10:00-12:00 • Group A</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">38 students</p>
                      <p className="text-sm text-success">95% attended</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-foreground">Session 2: Problem Solving</p>
                      <p className="text-sm text-muted-foreground">Tuesday 14:00-16:00 • Group B</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">32 students</p>
                      <p className="text-sm text-success">89% attended</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Class Management</CardTitle>
                <CardDescription>QR code check-ins and AI homework verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-6">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">Generate Check-in QR Code</h4>
                    <p className="text-sm text-muted-foreground">Students scan to mark attendance</p>
                  </div>
                  <Button className="gap-2">
                    <QrCode className="h-4 w-4" />
                    Generate QR
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">AI Homework Verification</h4>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Problem Set 2 - Group C</span>
                      <Badge className="bg-accent text-accent-foreground">AI Ready</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">42 submissions pending verification</p>
                    <Button variant="outline" className="w-full">Start AI Verification</Button>
                  </div>
                </div>

                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                  <p className="text-sm font-medium text-accent-foreground">💡 AI Tip</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI verification has 96% accuracy for mathematical problems. Review flagged submissions manually.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
