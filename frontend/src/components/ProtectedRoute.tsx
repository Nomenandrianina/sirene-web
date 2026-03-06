import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
