import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in and redirect to appropriate dashboard
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('student_id', session.user.id);

        const hasTeacher = roles?.some((r: any) => r.role === 'teacher');

        if (hasTeacher) {
          navigate("/ta");
        } else {
          navigate("/student");
        }
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check user role and redirect accordingly
      if (data.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('student_id', data.user.id);

        const hasTA = roles?.some((r: any) => r.role === 'ta');
        const hasTeacher = roles?.some((r: any) => r.role === 'teacher');

        toast.success("Logged in successfully!");
        
        if (hasTeacher) {
          navigate("/ta");
        } else {
          navigate("/student");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/40">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to TeachCompanion</CardTitle>
          <CardDescription>Sign in to access your courses and materials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="name@role.uni"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-border/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 border-border/40"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-medium text-foreground mb-2">📋 Pre-configured Test Accounts:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>👨‍🏫 Teacher: teacher@teacher.uni / Teacher2025!</p>
              <p>🎓 Student: student@student.uni / Student2025!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
