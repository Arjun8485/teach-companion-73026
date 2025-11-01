import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserCheck } from "lucide-react";
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

  const toggleTA = async (studentId: string, currentlyTA: boolean) => {
    try {
      if (currentlyTA) {
        // Remove TA role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("student_id", studentId)
          .eq("course_code", courseCode);

        if (error) throw error;
        toast.success("TA role removed");
      } else {
        // Add TA role
        const { error } = await supabase
          .from("user_roles")
          .insert({
            student_id: studentId,
            course_code: courseCode,
            role: "ta",
          });

        if (error) throw error;
        toast.success("TA role assigned");
      }

      // Refresh the list
      fetchStudents();
    } catch (error) {
      console.error("Error toggling TA:", error);
      toast.error("Failed to update TA role");
    }
  };

  const taCount = students.filter((s) => s.isTA).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Assign Teaching Assistants</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {taCount} TA{taCount !== 1 ? "s" : ""} assigned
          </p>
        </div>
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
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? "No students found matching your search" : "No students enrolled"}
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-3.5 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={student.isTA}
                    onCheckedChange={() => toggleTA(student.id, student.isTA)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{student.name}</p>
                      {student.isTA && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs h-5">
                          <UserCheck className="h-3 w-3 mr-1" />
                          TA
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{student.student_id}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
