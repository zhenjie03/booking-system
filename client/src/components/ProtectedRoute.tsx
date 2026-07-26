import { useEffect, type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    if (!isLoading && !user) openLogin({ dismissable: false });
  }, [isLoading, user, openLogin]);

  if (isLoading) return null;
  if (!user) return <p className="hint">Please log in to continue.</p>;

  return <>{children}</>;
}
