"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  Package,
  History,
  Settings,
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-lg justify-around px-1 py-1.5">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href ||
                (link.href === "/panel" && pathname === "/panel");
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-center text-[10px] transition-colors ${
                active
                  ? "font-semibold text-emerald-700"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-emerald-100" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`h-[1.125rem] w-[1.125rem] ${active ? "stroke-[2.5]" : "stroke-[2]"}`}
                  aria-hidden
                />
              </span>
              <span className="truncate leading-none">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
