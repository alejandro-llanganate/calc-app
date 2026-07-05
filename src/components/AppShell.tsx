"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavBar } from "./NavBar";

const WIDE_PREFIXES = ["/panel"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCaja = pathname === "/";
  const isWide =
    WIDE_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    ) && !isCaja;

  useEffect(() => {
    if (!isCaja) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isCaja]);

  return (
    <div
      className={`mx-auto flex w-full flex-col ${
        isCaja
          ? "h-dvh max-h-dvh overflow-hidden max-w-none bg-[var(--background)]"
          : "min-h-full max-w-[1440px] bg-[var(--background)]"
      }`}
    >
      <NavBar wide={isWide || isCaja} />
      <main
        className={`flex flex-col ${
          isCaja
            ? "min-h-0 flex-1 overflow-hidden px-0 pb-0 pt-[4.5rem]"
            : isWide
              ? "flex-1 px-5 pb-10 pt-[4rem] sm:px-8 lg:px-12"
              : "flex-1 px-4 pb-6 pt-[3.75rem]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
