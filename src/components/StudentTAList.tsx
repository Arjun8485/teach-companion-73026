import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserCheck, UserMinus, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  isTA: boolean;
}

interface StudentTAListProps {
  courseCode: string;
}

export default function StudentTAList({ courseCode }: StudentTAListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    student: Student | null;
    action: "add" | "remove";
  }>({ open: false, student: null, action: "add" });

  useEffect(() => {
    fetchStudents();
  }, [courseCode]);

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students for the course
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("course_code", courseCode);

      if (studentsError) throw studentsError;

      // Fetch TA roles for the course
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("student_id")
        .eq("course_code", courseCode);

      if (rolesError) throw rolesError;

      const taIds = new Set(rolesData?.map((r) => r.student_id) || []);

      const studentsWithTAStatus = (studentsData || []).map((student) => ({
        ...student,
        isTA: taIds.has(student.id),
      }));

      setStudents(studentsWithTAStatus);
      setFilteredStudents(studentsWithTAStatus);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTA = (student: Student) => {
    setConfirmDialog({
      open: true,
      student,
      action: student.isTA ? "remove" : "add",
    });
  };

  const confirmToggleTA = async () => {
    const { student, action } = confirmDialog;
    if (!student) return;

    try {
      if (action === "remove") {
        // Remove TA role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("student_id", student.id)
          .eq("course_code", courseCode);

        if (error) throw error;
        toast.success(`${student.name} is no longer a TA`);
      } else {
        // Add TA role
        const { error } = await supabase
          .from("user_roles")
          .insert({
            student_id: student.id,
            course_code: courseCode,
            role: "ta",
          });

        if (error) throw error;
        toast.success(`${student.name} has been assigned as TA`);
      }

      // Refresh the list
      fetchStudents();
    } catch (error) {
      console.error("Error toggling TA:", error);
      toast.error("Failed to update TA role");
    } finally {
      setConfirmDialog({ open: false, student: null, action: "add" });
    }
  };

  const currentTAs = students.filter((s) => s.isTA);
  const nonTAs = filteredStudents.filter((s) => !s.isTA);

  return (
    <div className="space-y-6">
      {/* Current TAs Section */}
      {currentTAs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Current Teaching Assistants</h3>
            <Badge variant="secondary" className="text-xs">
              {currentTAs.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {currentTAs.map((ta) => (
              <div
                key={ta.id}
                className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3.5"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs h-6">
                    <UserCheck className="h-3 w-3 mr-1" />
                    TA
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{ta.name}</p>
                    <p className="text-xs text-muted-foreground">{ta.email}</p>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{ta.student_id}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleTA(ta)}
                  className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserMinus className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign New TAs Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Assign New Teaching Assistants</h3>
        <p className="text-xs text-muted-foreground">
          Search and select students to assign as TAs
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 border-border/40"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading students...</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {nonTAs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? "No students found matching your search" : "All students are already TAs"}
            </div>
          ) : (
            nonTAs.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-3.5 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggleTA(student)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{student.student_id}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, student: null, action: "add" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "add" ? "Assign Teaching Assistant" : "Remove Teaching Assistant"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "add" ? (
                <>
                  Are you sure you want to assign <span className="font-semibold text-foreground">{confirmDialog.student?.name}</span> as a Teaching Assistant for this course?
                </>
              ) : (
                <>
                  Are you sure you want to remove <span className="font-semibold text-foreground">{confirmDialog.student?.name}</span> from the Teaching Assistant role?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleTA}>
              {confirmDialog.action === "add" ? "Assign TA" : "Remove TA"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
