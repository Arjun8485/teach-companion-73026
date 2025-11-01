import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPlus, UserMinus, Search } from "lucide-react";
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
    action: 'add' | 'remove';
  }>({
    open: false,
    student: null,
    action: 'add'
  });

  useEffect(() => {
    fetchStudents();
  }, [courseCode]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.student_id.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Fetch all user profiles (all students have access to all courses now)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) throw profilesError;

      // Fetch TA roles for this course
      const { data: taRoles, error: taError } = await supabase
        .from('user_roles')
        .select('student_id')
        .eq('course_id', courseCode)
        .eq('role', 'ta');

      if (taError) throw taError;

      const taIds = new Set(taRoles?.map((r) => r.student_id) || []);

      const studentsList: Student[] = (profilesData || []).map((p) => ({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        student_id: p.id,
        isTA: taIds.has(p.id),
      }));

      setStudents(studentsList);
      setFilteredStudents(studentsList);
    } catch (error: any) {
      toast.error("Failed to load students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTA = (student: Student) => {
    setConfirmDialog({
      open: true,
      student,
      action: student.isTA ? 'remove' : 'add'
    });
  };

  const confirmToggleTA = async () => {
    const { student, action } = confirmDialog;
    if (!student) return;

    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            student_id: student.student_id,
            role: 'ta',
            course_id: courseCode
          });

        if (error) throw error;
        toast.success(`${student.name} is now a TA`);
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('student_id', student.student_id)
          .eq('course_id', courseCode)
          .eq('role', 'ta');

        if (error) throw error;
        toast.success(`${student.name} is no longer a TA`);
      }

      await fetchStudents();
    } catch (error: any) {
      toast.error(`Failed to ${action} TA role`);
      console.error(error);
    } finally {
      setConfirmDialog({ open: false, student: null, action: 'add' });
    }
  };

  const currentTAs = filteredStudents.filter((s) => s.isTA);
  const availableStudents = filteredStudents.filter((s) => !s.isTA);

  if (loading) {
    return <div className="text-muted-foreground">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Teaching Assistants</CardTitle>
          <CardDescription>Students who have TA privileges for this course</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTAs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No TAs assigned yet</p>
          ) : (
            <div className="space-y-2">
              {currentTAs.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-border/40 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleTA(student)}
                    className="gap-2"
                  >
                    <UserMinus className="h-4 w-4" />
                    Remove TA
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Teaching Assistants</CardTitle>
          <CardDescription>Select students to grant TA access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {availableStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No students found" : "All students are already TAs"}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-border/40 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleTA(student)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Make TA
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, student: null, action: 'add' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'add' ? 'Assign TA Role' : 'Remove TA Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'add'
                ? `Are you sure you want to make ${confirmDialog.student?.name} a Teaching Assistant for this course? They will gain access to the TA dashboard.`
                : `Are you sure you want to remove ${confirmDialog.student?.name} as a Teaching Assistant? They will lose access to the TA dashboard.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleTA}>
              {confirmDialog.action === 'add' ? 'Assign TA' : 'Remove TA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
