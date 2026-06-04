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
import { useAppData } from "@/context/AppDataProvider";
import { formatMoney } from "@/lib/format";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Caja", icon: Calculator },
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/panel/productos", label: "Productos", icon: Package },
  { href: "/panel/historial", label: "Historial", icon: History },
  { href: "/panel/configuracion", label: "Ajustes", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/panel": "Panel",
  "/panel/productos": "Productos",
  "/panel/historial": "Historial",
  "/panel/configuracion": "Ajustes",
};

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { settings, todayTotal, todayPurchases, toggleItemDetails } =
    useAppData();

  const isCaja = pathname === "/";
  const detailMode = settings.features.itemDetails;
  const symbol = settings.currencySymbol;

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

  const headerTop = isCaja ? "4.25rem" : "3.25rem";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 safe-top ${
          isCaja
            ? "border-b border-emerald-800/30 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-md shadow-emerald-900/15"
            : "border-b border-stone-200 bg-white/95 text-stone-900 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5">
          {isCaja ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-emerald-100">
                {settings.storeName}
              </p>
              <p className="truncate text-sm font-bold tabular-nums leading-tight">
                {formatMoney(todayTotal, symbol)}
                <span className="ml-1.5 text-xs font-medium text-emerald-200">
                  · {todayPurchases.length}{" "}
                  {todayPurchases.length === 1 ? "compra" : "compras"}
                </span>
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-stone-500">
                {settings.storeName}
              </p>
              <p className="truncate text-sm font-semibold text-emerald-800">
                {pageTitles[pathname] ?? "Caja Ventas"}
              </p>
            </div>
          )}

          {isCaja && (
            <button
              type="button"
              onClick={() => toggleItemDetails(!detailMode)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                detailMode
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "bg-white/15 text-emerald-50 ring-1 ring-white/30"
              }`}
            >
              {detailMode ? "Detalle ON" : "Detalle OFF"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              isCaja
                ? "bg-white/15 text-white ring-1 ring-white/25 active:bg-white/25"
                : "border border-stone-200 bg-stone-50 text-stone-700 active:bg-stone-100"
            }`}
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
            className="fixed left-0 right-0 bottom-0 z-40 bg-stone-900/30 backdrop-blur-[1px]"
            style={{ top: headerTop }}
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed left-0 right-0 z-50 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-stone-200 bg-white shadow-lg"
            style={{ top: headerTop }}
          >
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
