import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ChevronDown, FileText } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  file_url: string | null;
  questions: Array<{ question_number: number; max_marks: number }>;
  max_marks: number;
  profiles: { full_name: string } | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_url: string | null;
  completed_questions: number[];
  question_marks: Record<string, number>;
  total_marks: number;
  grading_finalized: boolean;
  submitted_at: string;
}

interface StudentAssignmentViewProps {
  courseId: string;
}

export default function StudentAssignmentView({ courseId }: StudentAssignmentViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, number[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    await Promise.all([loadAssignments(), loadSubmissions()]);
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, profiles:created_by(full_name)')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments((data || []) as unknown as Assignment[]);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;

      const submissionsMap: Record<string, Submission> = {};
      data?.forEach((sub) => {
        submissionsMap[sub.assignment_id] = sub as Submission;
      });
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleFileSelect = (assignmentId: string, file: File | undefined) => {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [assignmentId]: file }));
  };

  const handleQuestionToggle = (assignmentId: string, questionNumber: number) => {
    setCompletedQuestions(prev => {
      const current = prev[assignmentId] || [];
      const updated = current.includes(questionNumber)
        ? current.filter(q => q !== questionNumber)
        : [...current, questionNumber];
      return { ...prev, [assignmentId]: updated };
    });
  };

  const handleSubmit = async (assignmentId: string) => {
    setSubmitting(assignmentId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let fileUrl = null;
      const file = uploadingFiles[assignmentId];

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${assignmentId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('submission-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submission-files')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const completed = completedQuestions[assignmentId] || [];
      
      const { error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: fileUrl || submissions[assignmentId]?.file_url,
          completed_questions: completed,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission uploaded successfully",
      });

      await loadSubmissions();
      setUploadingFiles(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
      if (fileInputRefs.current[assignmentId]) {
        fileInputRefs.current[assignmentId]!.value = "";
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  // Categorize assignments
  const now = new Date();
  const dueAssignments = assignments.filter(a => {
    const submission = submissions[a.id];
    const isDue = !a.due_date || new Date(a.due_date) >= now;
    return isDue && !submission;
  });
  
  const submittedAssignments = assignments.filter(a => {
    const submission = submissions[a.id];
    const isDue = !a.due_date || new Date(a.due_date) >= now;
    return isDue && submission;
  });
  
  const pastAssignments = assignments.filter(a => {
    const isPast = a.due_date && new Date(a.due_date) < now;
    return isPast;
  });

  const renderAssignment = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    const isExpanded = expandedAssignment === assignment.id;
    const questions = assignment.questions || [];

    return (
      <Collapsible
        key={assignment.id}
        open={isExpanded}
        onOpenChange={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
      >
        <Card className="border-border/40">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="text-left flex-1">
                  <CardTitle className="text-base font-medium">{assignment.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {assignment.due_date && (
                      <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                    )}
                    {assignment.created_at && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Created: {format(new Date(assignment.created_at), 'MMM d, yyyy')}</span>
                      </>
                    )}
                    {assignment.max_marks > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Max Marks: {assignment.max_marks}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {submission?.grading_finalized && (
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Graded: {submission.total_marks}/{assignment.max_marks}
                    </Badge>
                  )}
                  {submission && !submission.grading_finalized && (
                    <Badge variant="secondary">Submitted</Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {assignment.description && (
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
              )}

              {assignment.file_url && (
                <a 
                  href={assignment.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Assignment PDF
                </a>
              )}

              {!submission?.grading_finalized && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Upload Your Submission
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={(el) => fileInputRefs.current[assignment.id] = el}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(assignment.id, e.target.files?.[0])}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    {uploadingFiles[assignment.id] && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {uploadingFiles[assignment.id].name}
                      </div>
                    )}
                    {submission?.file_url && !uploadingFiles[assignment.id] && (
                      <div className="text-xs text-muted-foreground">
                        Current submission: <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View PDF</a>
                      </div>
                    )}
                  </div>

                  {questions.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Questions Completed
                      </label>
                      <div className="space-y-2">
                        {questions.map((q) => (
                          <div key={q.question_number} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${assignment.id}-q${q.question_number}`}
                              checked={(completedQuestions[assignment.id] || submission?.completed_questions || []).includes(q.question_number)}
                              onCheckedChange={() => handleQuestionToggle(assignment.id, q.question_number)}
                            />
                            <label
                              htmlFor={`${assignment.id}-q${q.question_number}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Question {q.question_number} ({q.max_marks} marks)
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSubmit(assignment.id)}
                    disabled={submitting === assignment.id || (!uploadingFiles[assignment.id] && !submission)}
                    className="w-full"
                  >
                    {submitting === assignment.id ? (
                      "Submitting..."
                    ) : submission ? (
                      "Update Submission"
                    ) : (
                      "Submit Assignment"
                    )}
                  </Button>
                </div>
              )}

              {submission?.grading_finalized && questions.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Your Grades
                  </label>
                  <div className="space-y-1">
                    {questions.map((q) => (
                      <div key={q.question_number} className="flex items-center justify-between text-sm">
                        <span>Question {q.question_number}</span>
                        <span className="font-medium">
                          {submission.question_marks?.[q.question_number] || 0} / {q.max_marks}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>{submission.total_marks} / {assignment.max_marks}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="font-medium">Due Assignments ({dueAssignments.length})</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          {dueAssignments.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No due assignments
              </CardContent>
            </Card>
          ) : (
            dueAssignments.map(renderAssignment)
          )}
        </CollapsibleContent>
      </Collapsible>

      {submittedAssignments.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="font-medium">Submitted Assignments ({submittedAssignments.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {submittedAssignments.map(renderAssignment)}
          </CollapsibleContent>
        </Collapsible>
      )}

      {pastAssignments.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="font-medium">Past Assignments ({pastAssignments.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {pastAssignments.map(renderAssignment)}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
