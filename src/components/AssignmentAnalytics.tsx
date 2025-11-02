import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface AssignmentAnalyticsProps {
  assignments: {
    id: string;
    title: string;
    dueDate: string | null;
    totalSubmissions: number;
    gradedSubmissions: number;
    avgMarks: number;
    maxMarks: number;
  }[];
  totalStudents: number;
}

export default function AssignmentAnalytics({ assignments, totalStudents }: AssignmentAnalyticsProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No assignments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignments.map((assignment) => {
          const submissionRate = totalStudents > 0 
            ? Math.round((assignment.totalSubmissions / totalStudents) * 100) 
            : 0;
          const gradingProgress = assignment.totalSubmissions > 0
            ? Math.round((assignment.gradedSubmissions / assignment.totalSubmissions) * 100)
            : 0;

          return (
            <Collapsible key={assignment.id}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{assignment.title}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {assignment.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {format(new Date(assignment.dueDate), "MMM d")}
                      </span>
                    )}
                    <span>{assignment.totalSubmissions} submissions</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 rounded-lg border border-t-0 p-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Submission Rate
                    </div>
                    <div className="text-2xl font-bold">{submissionRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.totalSubmissions} of {totalStudents} students
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4" />
                      Grading Progress
                    </div>
                    <div className="text-2xl font-bold">{gradingProgress}%</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.gradedSubmissions} of {assignment.totalSubmissions} graded
                    </div>
                  </div>
                </div>
                {assignment.gradedSubmissions > 0 && (
                  <div className="space-y-1 border-t pt-3">
                    <div className="text-sm text-muted-foreground">Average Score</div>
                    <div className="text-2xl font-bold">
                      {assignment.avgMarks} / {assignment.maxMarks}
                      <span className="ml-2 text-base text-muted-foreground">
                        ({Math.round((assignment.avgMarks / assignment.maxMarks) * 100)}%)
                      </span>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
