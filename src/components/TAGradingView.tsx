import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download, Check, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Assignment {
  id: string;
  title: string;
  questions: Array<{ question_number: number; max_marks: number }>;
  max_marks: number;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  completed_questions: number[];
  question_marks: Record<string, number>;
  total_marks: number;
  grading_finalized: boolean;
  submitted_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface TAGradingViewProps {
  courseId: string;
  isTeacher?: boolean;
}

export default function TAGradingView({ courseId, isTeacher = false }: TAGradingViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingMarks, setEditingMarks] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, questions, max_marks')
        .eq('course_id', courseId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setAssignments((data || []) as unknown as Assignment[]);
      if (data && data.length > 0 && !selectedAssignment) {
        setSelectedAssignment(data[0].id);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, profiles!submissions_student_id_fkey(full_name, email)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions((data || []) as unknown as Submission[]);

      // Initialize editing marks
      const marks: Record<string, Record<string, number>> = {};
      data?.forEach(sub => {
        marks[sub.id] = (sub.question_marks as Record<string, number>) || {};
      });
      setEditingMarks(marks);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const updateQuestionMark = (submissionId: string, questionNumber: number, marks: number, maxMarks: number) => {
    const clampedMarks = Math.max(0, Math.min(marks, maxMarks));
    setEditingMarks(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [questionNumber]: clampedMarks,
      }
    }));
  };

  const handleSaveGrades = async (submissionId: string) => {
    setSaving(submissionId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const marks = editingMarks[submissionId] || {};
      const totalMarks = Object.values(marks).reduce((sum, m) => sum + m, 0);

      const { error } = await supabase
        .from('submissions')
        .update({
          question_marks: marks,
          total_marks: totalMarks,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grades saved successfully",
      });

      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment);
      }
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save grades",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleViewPDF = async (filePath: string, fileName: string) => {
    try {
      let bucketId: string;
      let path: string;

      // Check if it's a full URL or just a path
      if (filePath.startsWith('http')) {
        // Extract bucket and path from URL
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/').filter(p => p);
        
        // URL format: .../storage/v1/object/public/bucket-name/path
        const storageIndex = pathParts.indexOf('storage');
        if (storageIndex !== -1 && pathParts[storageIndex + 3] === 'public') {
          bucketId = pathParts[storageIndex + 4];
          path = pathParts.slice(storageIndex + 5).join('/');
        } else {
          throw new Error('Invalid URL format');
        }
      } else {
        // It's a path, assume submission-files for TA grading view
        bucketId = 'submission-files';
        path = filePath;
      }

      // Download file as blob
      const { data, error } = await supabase.storage
        .from(bucketId)
        .download(path);

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error: any) {
      console.error('Error viewing PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleFinalizeGrading = async (submissionId: string) => {
    try {
      // First save the current grades
      await handleSaveGrades(submissionId);

      // Then finalize
      const { error } = await supabase
        .from('submissions')
        .update({ grading_finalized: true })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grading finalized successfully",
      });

      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment);
      }
    } catch (error: any) {
      console.error('Error finalizing grading:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to finalize grading",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
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

      setSelectedAssignment(null);
      await loadAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const currentAssignment = assignments.find(a => a.id === selectedAssignment);
  const questions = currentAssignment?.questions || [];

  return (
    <div className="space-y-6">
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Card className="border-border/40 cursor-pointer hover:bg-accent/5 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">Select Assignment</CardTitle>
                  <CardDescription className="text-sm">Choose an assignment to grade submissions</CardDescription>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="border-border/40 mt-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex gap-1">
                    <Button
                      variant={selectedAssignment === assignment.id ? "default" : "outline"}
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className="justify-start flex-1"
                    >
                      {assignment.title}
                    </Button>
                    {isTeacher && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="h-10 w-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {selectedAssignment && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Submissions ({submissions.length})</h3>
          </div>

          {submissions.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No submissions yet
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="border-border/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        {submission.profiles?.full_name || "Unknown Student"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {submission.profiles?.email} • Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                      </CardDescription>
                    </div>
                    {submission.grading_finalized && (
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        Finalized
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.file_url && (
                    <button 
                      onClick={() => handleViewPDF(submission.file_url!, `submission_${submission.profiles?.full_name}.pdf`)}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      View Submission PDF
                    </button>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Completed Questions
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {submission.completed_questions.map(q => (
                        <Badge key={q} variant="secondary">Q{q}</Badge>
                      ))}
                      {submission.completed_questions.length === 0 && (
                        <span className="text-sm text-muted-foreground">None marked</span>
                      )}
                    </div>
                  </div>

                  {questions.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Grade Questions (Only Completed)
                      </label>
                      <div className="space-y-2">
                        {questions
                          .filter(q => submission.completed_questions.includes(q.question_number))
                          .map((q) => (
                            <div key={q.question_number} className="flex items-center gap-2">
                              <span className="text-sm w-20">Q{q.question_number}</span>
                              <Input
                                type="number"
                                min="0"
                                max={q.max_marks}
                                value={editingMarks[submission.id]?.[q.question_number] || 0}
                                onChange={(e) => updateQuestionMark(submission.id, q.question_number, parseInt(e.target.value) || 0, q.max_marks)}
                                className="w-24"
                              />
                              <span className="text-xs text-muted-foreground">/ {q.max_marks} marks</span>
                            </div>
                          ))}
                        <div className="flex items-center justify-between pt-2 border-t text-sm font-semibold">
                          <span>Total</span>
                          <span>
                            {Object.values(editingMarks[submission.id] || {}).reduce((sum, m) => sum + m, 0)} / {currentAssignment?.max_marks || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSaveGrades(submission.id)}
                      disabled={saving === submission.id}
                      variant="outline"
                      className="flex-1"
                    >
                      {saving === submission.id ? "Saving..." : "Save Grades"}
                    </Button>
                    {!submission.grading_finalized && (
                      <Button
                        onClick={() => handleFinalizeGrading(submission.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Finalize Grading
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
