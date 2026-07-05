"use client";

import { useEffect, useState } from "react";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { AdminLogin } from "./AdminLogin";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--calc-muted)]">
        Cargando…
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return children;
}
