"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isAdminAuthenticated,
  loginAdmin as verifyAdminLogin,
  logoutAdmin as clearAdminSession,
} from "@/lib/admin/auth";
import { AdminLogin } from "./AdminLogin";

type AdminAuthContextValue = {
  authed: boolean;
  ready: boolean;
  login: (cedula: string, code: string) => boolean;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
    setReady(true);
  }, []);

  const login = useCallback((cedula: string, code: string) => {
    const ok = verifyAdminLogin(cedula, code);
    if (ok) setAuthed(true);
    return ok;
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setAuthed(false);
  }, []);

  const value = useMemo(
    () => ({ authed, ready, login, logout }),
    [authed, ready, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider");
  }
  return ctx;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { authed, ready, login } = useAdminAuth();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--calc-muted)]">
        Cargando…
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin onLogin={login} />
    );
  }

  return children;
}
