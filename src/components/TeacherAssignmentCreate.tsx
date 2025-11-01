import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, FileText } from "lucide-react";

interface TeacherAssignmentCreateProps {
  courseId: string;
  onSuccess: () => void;
}

interface Question {
  question_number: number;
  max_marks: number;
}

export default function TeacherAssignmentCreate({ courseId, onSuccess }: TeacherAssignmentCreateProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question_number: 1, max_marks: 10 }]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const addQuestion = () => {
    const nextNumber = questions.length + 1;
    setQuestions([...questions, { question_number: nextNumber, max_marks: 10 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast({
        title: "Error",
        description: "Assignment must have at least one question",
        variant: "destructive",
      });
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    // Renumber questions
    updated.forEach((q, i) => {
      q.question_number = i + 1;
    });
    setQuestions(updated);
  };

  const updateQuestionMarks = (index: number, marks: number) => {
    const updated = [...questions];
    updated[index].max_marks = Math.max(0, marks);
    setQuestions(updated);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an assignment title",
        variant: "destructive",
      });
      return;
    }

    if (questions.some(q => q.max_marks <= 0)) {
      toast({
        title: "Error",
        description: "All questions must have marks greater than 0",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totalMarks = questions.reduce((sum, q) => sum + q.max_marks, 0);

      // First create the assignment to get the ID
      const { data: newAssignment, error: insertError } = await supabase
        .from('assignments')
        .insert([{
          course_id: courseId,
          title,
          description: description || null,
          due_date: dueDate || null,
          created_by: user.id,
          file_url: null, // Will update after file upload
          questions: questions as any,
          max_marks: totalMarks,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      let fileUrl = null;

      // Now upload the file to organized folder structure if provided
      if (uploadedFile && newAssignment) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${courseId}/${newAssignment.id}/assignment.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assignment-files')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;

        // Update assignment with file URL
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ file_url: fileUrl })
          .eq('id', newAssignment.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setQuestions([{ question_number: 1, max_marks: 10 }]);
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      onSuccess();
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

  const totalMarks = questions.reduce((sum, q) => sum + q.max_marks, 0);

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Create New Assignment</CardTitle>
        <CardDescription className="text-sm">Define assignment details and questions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment Title</label>
          <Input 
            placeholder="e.g., Problem Set 3: Dynamics" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
          <Textarea 
            placeholder="Describe the assignment objectives and requirements..." 
            rows={3} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
          <Input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upload PDF</label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
          />
          {uploadedFile && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" />
              {uploadedFile.name}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Questions (Total: {totalMarks} marks)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              className="h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Question
            </Button>
          </div>

          <div className="space-y-2">
            {questions.map((question, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm w-20">Q{question.question_number}</span>
                <Input
                  type="number"
                  min="0"
                  value={question.max_marks}
                  onChange={(e) => updateQuestionMarks(index, parseInt(e.target.value) || 0)}
                  placeholder="Marks"
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">marks</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                  disabled={questions.length === 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleCreate}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Assignment"}
        </Button>
      </CardContent>
    </Card>
  );
}
