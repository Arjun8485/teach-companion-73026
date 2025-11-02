import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import DynamicQRCode from "./DynamicQRCode";
import { format } from "date-fns";

interface ExerciseSession {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  is_recurring: boolean;
  recurrence_day_of_week: number | null;
  recurrence_time: string | null;
}

interface ExerciseSessionManagerProps {
  courseId: string;
}

export default function ExerciseSessionManager({ courseId }: ExerciseSessionManagerProps) {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: 60,
    isRecurring: false,
    dayOfWeek: "1",
  });

  useEffect(() => {
    loadSessions();
  }, [courseId]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_sessions")
        .select("*")
        .eq("course_id", courseId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast.error("Failed to load sessions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scheduledAt = formData.isRecurring
        ? new Date() // For recurring, we'll use current time, actual schedule is in recurrence fields
        : new Date(`${formData.date}T${formData.time}`);

      const sessionData: any = {
        course_id: courseId,
        title: formData.title,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: formData.duration,
        created_by: user.id,
        is_recurring: formData.isRecurring,
      };

      if (formData.isRecurring) {
        sessionData.recurrence_day_of_week = parseInt(formData.dayOfWeek);
        sessionData.recurrence_time = formData.time;
      }

      const { error } = await supabase
        .from("exercise_sessions")
        .insert(sessionData);

      if (error) throw error;

      toast.success("Exercise session created successfully");
      setShowCreateForm(false);
      setFormData({
        title: "",
        date: "",
        time: "",
        duration: 60,
        isRecurring: false,
        dayOfWeek: "1",
      });
      loadSessions();
    } catch (error: any) {
      toast.error("Failed to create session: " + error.message);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("exercise_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session deleted");
      loadSessions();
    } catch (error: any) {
      toast.error("Failed to delete session: " + error.message);
    }
  };

  const isSessionActive = (session: ExerciseSession) => {
    const now = new Date();
    const scheduledAt = new Date(session.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + session.duration_minutes * 60000);
    return now >= scheduledAt && now <= endTime;
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exercise Sessions</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Exercise Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Week 3 Exercise Class"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <Label htmlFor="recurring">Recurring Weekly Session</Label>
            </div>

            {formData.isRecurring ? (
              <>
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={formData.dayOfWeek}
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min={15}
                max={240}
              />
            </div>

            <Button onClick={handleCreateSession} className="w-full">
              Create Session
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No exercise sessions yet. Create one to start taking attendance.
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => {
            const active = isSessionActive(session);
            return (
              <Card key={session.id} className={active ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {session.title}
                        {active && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            ACTIVE
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {session.is_recurring
                            ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][session.recurrence_day_of_week || 0]}`
                            : format(new Date(session.scheduled_at), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.is_recurring
                            ? session.recurrence_time
                            : format(new Date(session.scheduled_at), "HH:mm")}
                        </span>
                        <span>{session.duration_minutes} min</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeSessionId === session.id ? (
                    <>
                      <DynamicQRCode sessionId={session.id} />
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setActiveSessionId(null)}
                      >
                        Hide QR Code
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      Show QR Code for Attendance
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
