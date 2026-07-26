import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    if (!isLoading && !user) openLogin({ dismissable: false });
  }, [isLoading, user, openLogin]);

  if (isLoading) return null;
  if (!user) return <p className="hint">Please log in to continue.</p>;
  if (user.role !== "ADMIN") return <Navigate to="/book" replace />;

  return <>{children}</>;
}
