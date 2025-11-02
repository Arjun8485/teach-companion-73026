import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CourseAnalytics {
  totalStudents: number;
  avgAttendance: number;
  assignmentsCompleted: number;
  upcomingDeadlines: number;
  loading: boolean;
}

export function useCourseAnalytics(courseId: string): CourseAnalytics {
  const [analytics, setAnalytics] = useState<CourseAnalytics>({
    totalStudents: 0,
    avgAttendance: 0,
    assignmentsCompleted: 0,
    upcomingDeadlines: 0,
    loading: true,
  });

  useEffect(() => {
    loadAnalytics();
  }, [courseId]);

  const loadAnalytics = async () => {
    try {
      // Get total students in course
      const { data: students, error: studentsError } = await supabase
        .from("user_roles")
        .select("student_id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("role", "student");

      if (studentsError) throw studentsError;

      // Get total assignments for the course
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id")
        .eq("course_id", courseId);

      if (assignmentsError) throw assignmentsError;

      // Get total submissions
      const assignmentIds = assignments?.map((a) => a.id) || [];
      
      let submissionsCount = 0;
      if (assignmentIds.length > 0) {
        const { count, error: submissionsError } = await supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .in("assignment_id", assignmentIds);

        if (submissionsError) throw submissionsError;
        submissionsCount = count || 0;
      }

      // Get attendance data
      const { data: sessions } = await supabase
        .from("exercise_sessions")
        .select("id")
        .eq("course_id", courseId);

      const sessionIds = sessions?.map((s) => s.id) || [];
      
      let attendanceCount = 0;
      if (sessionIds.length > 0) {
        const { count } = await supabase
          .from("session_attendance")
          .select("*", { count: "exact", head: true })
          .in("session_id", sessionIds);

        attendanceCount = count || 0;
      }

      // Calculate metrics
      const totalStudents = students?.length || 0;
      const totalAssignments = assignments?.length || 0;
      const totalSessions = sessions?.length || 0;
      
      const avgAttendance = totalSessions > 0 && totalStudents > 0
        ? Math.round((attendanceCount / (totalSessions * totalStudents)) * 100)
        : 0;

      const assignmentsCompleted = totalAssignments > 0 && totalStudents > 0
        ? Math.round((submissionsCount / (totalAssignments * totalStudents)) * 100)
        : 0;

      // Get upcoming deadlines (assignments due in next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { count: upcomingCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)
        .gte("due_date", now.toISOString())
        .lte("due_date", nextWeek.toISOString());

      setAnalytics({
        totalStudents,
        avgAttendance,
        assignmentsCompleted,
        upcomingDeadlines: upcomingCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      setAnalytics((prev) => ({ ...prev, loading: false }));
    }
  };

  return analytics;
}
