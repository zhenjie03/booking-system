import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setAuthToken } from "../api/client";
import type { User } from "../api/types";

type AuthResponse = { token: string; user: User };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "booking_system_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthResponse;
      setAuthToken(parsed.token);
      setUser(parsed.user);
    }
    setIsLoading(false);
  }, []);

  function persist(auth: AuthResponse) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setAuthToken(auth.token);
    setUser(auth.user);
  }

  async function login(email: string, password: string) {
    const auth = await api.post<AuthResponse>("/auth/login", { email, password });
    persist(auth);
  }

  async function register(email: string, password: string, name: string) {
    const auth = await api.post<AuthResponse>("/auth/register", { email, password, name });
    persist(auth);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
