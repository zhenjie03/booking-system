import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type AuthModalMode = "login" | "register";
type OpenOptions = { dismissable?: boolean };

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthModalMode;
  isDismissable: boolean;
  openLogin: (options?: OpenOptions) => void;
  openRegister: (options?: OpenOptions) => void;
  close: () => void;
  setMode: (mode: AuthModalMode) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");
  const [isDismissable, setIsDismissable] = useState(true);

  const openLogin = useCallback((options?: OpenOptions) => {
    setMode("login");
    setIsDismissable(options?.dismissable ?? true);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback((options?: OpenOptions) => {
    setMode("register");
    setIsDismissable(options?.dismissable ?? true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, mode, isDismissable, openLogin, openRegister, close, setMode }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
