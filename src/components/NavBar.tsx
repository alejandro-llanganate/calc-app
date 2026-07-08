"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calculator,
  History,
  Settings,
  Menu,
  X,
  UserRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppData } from "@/context/AppDataProvider";
import { formatMoney } from "@/lib/format";
import { AddDebtModal } from "./AddDebtModal";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Caja", icon: Calculator },
  { href: "/panel/debe", label: "Debe", icon: Wallet },
  { href: "/panel/historial", label: "Historial", icon: History },
  { href: "/panel/configuracion", label: "Ajustes", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/panel/debe": "Debe",
  "/panel/historial": "Historial",
  "/panel/configuracion": "Ajustes",
};

export function NavBar({ wide = false }: { wide?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const {
    settings,
    todayTotal,
    todayPurchases,
    toggleItemDetails,
    activeUser,
    clearActiveUser,
    debtSummary,
    isOnline,
    pendingSync,
  } = useAppData();

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
      : pathname === href || pathname.startsWith(`${href}/`);

  const headerTop = isCaja ? "4.5rem" : "3.75rem";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b safe-top ${
          isCaja
            ? "calc-mica border-[var(--calc-border)]"
            : "border-stone-200 bg-white/95 backdrop-blur"
        }`}
      >
        <div
          className={`mx-auto flex max-w-none items-center gap-2.5 px-3 py-3 ${wide ? "lg:px-12" : "lg:px-4"}`}
        >
          {isCaja ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-[#1a1a1a]">
                  {settings.storeName}
                </p>
                <p className="truncate text-xs text-[var(--calc-muted)]">
                  {!isOnline && (
                    <span className="mr-1 font-medium text-amber-700">
                      Sin conexión ·
                    </span>
                  )}
                  {isOnline && pendingSync > 0 && (
                    <span className="mr-1 font-medium text-amber-700">
                      Sincronizando {pendingSync}… ·
                    </span>
                  )}
                  {formatMoney(todayTotal, symbol)} · {todayPurchases.length}{" "}
                  {todayPurchases.length === 1 ? "compra" : "compras"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDebtOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-[#fff4ce] px-2.5 py-1.5 text-xs font-semibold text-[#835c00]"
              >
                <Wallet className="h-4 w-4" />
                Debe
                {debtSummary.countPending > 0 && (
                  <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">
                    {debtSummary.countPending}
                  </span>
                )}
              </button>
              {activeUser ? (
                <>
                  <span className="hidden max-w-[7rem] truncate rounded-lg bg-[#deecf9] px-2.5 py-1.5 text-xs font-semibold text-[var(--calc-accent)] sm:inline sm:max-w-[9rem]">
                    {activeUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearActiveUser}
                    title="Cerrar sesión de caja"
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--calc-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--calc-muted)] hover:bg-[#f3f2f1]"
                  >
                    <UserRound className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="flex max-w-[8rem] shrink-0 items-center gap-1 truncate rounded-lg bg-[#fde7e9] px-2.5 py-1.5 text-xs font-semibold text-[#a4262c] animate-pulse sm:max-w-[9rem]"
                >
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="truncate">Iniciar sesión</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleItemDetails(!detailMode)}
                className={`hidden shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold sm:inline ${
                  detailMode
                    ? "bg-[var(--calc-accent)] text-white"
                    : "bg-[#edebe9] text-[var(--calc-muted)]"
                }`}
              >
                {detailMode ? "Detalle ON" : "Detalle OFF"}
              </button>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-stone-500">
                {settings.storeName}
              </p>
              <p className="truncate text-base font-semibold text-stone-900">
                {pageTitles[pathname] ?? "Caja Ventas"}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#1a1a1a] transition-colors hover:bg-black/5 active:bg-black/10"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <AddDebtModal open={debtOpen} onClose={() => setDebtOpen(false)} />

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed left-0 right-0 bottom-0 z-40 bg-black/20 backdrop-blur-[1px]"
            style={{ top: headerTop }}
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed left-0 right-0 z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-[var(--calc-border)] bg-white shadow-lg"
            style={{ top: headerTop }}
          >
            <ul className={`mx-auto py-1 ${wide ? "max-w-[1440px] px-5 lg:px-12" : "max-w-lg"}`}>
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
                          ? "bg-[#deecf9] font-medium text-[var(--calc-accent)]"
                          : "text-[#1a1a1a] hover:bg-[#f3f2f1]"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? "text-[var(--calc-accent)]" : "text-[var(--calc-muted)]"}`}
                      />
                      {link.label}
                      {link.href === "/panel/debe" &&
                        debtSummary.countPending > 0 && (
                          <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                            {debtSummary.countPending}
                          </span>
                        )}
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
