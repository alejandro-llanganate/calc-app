"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCaja = pathname === "/";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-stone-50">
      <NavBar />
      <main
        className={`flex flex-1 flex-col px-4 pb-6 ${isCaja ? "pt-[4.5rem]" : "pt-[3.75rem]"}`}
      >
        {children}
      </main>
    </div>
  );
}
