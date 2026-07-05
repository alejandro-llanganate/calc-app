"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, LayoutDashboard, LogOut, Users } from "lucide-react";
import { logoutAdmin } from "@/lib/admin/auth";

const links = [
  { href: "/admin/reportes", label: "Reportes", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const logout = () => {
    logoutAdmin();
    window.location.href = "/admin/";
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--calc-border)] bg-white/95 backdrop-blur safe-top">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
              Administración
            </p>
            <nav className="mt-1 flex flex-wrap gap-1">
              {links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      active
                        ? "bg-[#deecf9] text-[var(--calc-accent)]"
                        : "text-[#1a1a1a] hover:bg-[#f3f2f1]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--calc-border)] px-3 py-2 text-sm font-medium hover:bg-[#f3f2f1]"
            >
              <Calculator className="h-4 w-4" />
              Caja
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--calc-border)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 pb-10 pt-6 lg:px-12">{children}</main>
    </div>
  );
}
