"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calculator,
  LayoutDashboard,
  Package,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Caja", icon: Calculator },
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/panel/productos", label: "Productos", icon: Package },
  { href: "/panel/historial", label: "Historial", icon: History },
  { href: "/panel/configuracion", label: "Ajustes", icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href ||
        (href === "/panel" && pathname === "/panel");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-emerald-800">
            Caja Ventas
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 active:bg-stone-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed top-[57px] left-0 right-0 z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-b border-stone-200 bg-white shadow-lg">
            <ul className="mx-auto max-w-lg py-2">
              {links.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 text-base transition-colors ${
                        active
                          ? "bg-emerald-50 font-semibold text-emerald-800"
                          : "text-stone-700 active:bg-stone-50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? "text-emerald-700" : "text-stone-500"}`}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
