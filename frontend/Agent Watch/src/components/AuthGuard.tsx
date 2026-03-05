import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


