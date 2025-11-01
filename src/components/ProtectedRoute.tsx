import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('teacher' | 'ta' | 'student')[];
  courseCode?: string;
}

const ProtectedRoute = ({ children, allowedRoles, courseCode = 'CS101' }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setAuthorized(false);
        return;
      }

      if (!allowedRoles || allowedRoles.length === 0) {
        setAuthorized(true);
        return;
      }

      // Check if user has any of the allowed roles
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('student_id', user.id)
        .eq('course_code', courseCode)
        .single();

      if (data && allowedRoles.includes(data.role as any)) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    };

    checkRole();
  }, [user, allowedRoles, courseCode]);

  if (loading || authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
