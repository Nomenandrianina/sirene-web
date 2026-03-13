import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  adminOnly?:  boolean;          // ancienne prop conservée
  permission?: string;           // nouvelle prop — permission requise
  any?:        string[];         // au moins une de ces permissions
}

export function ProtectedRoute({ children, adminOnly, permission, any: anyPerms }: Props) {
  const { isAuthenticated, isSuperAdmin, can, canAny, loading } = useAuth();

  if (loading) return null;

  // Non connecté → login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // adminOnly → réservé superadmin (comportement existant conservé)
  if (adminOnly && !isSuperAdmin) return <Navigate to="/" replace />;

  // Permission unique requise
  if (permission && !can(permission)) return <Navigate to="/" replace />;

  // Au moins une permission requise
  if (anyPerms && !canAny(...anyPerms)) return <Navigate to="/" replace />;

  return <>{children}</>;
}