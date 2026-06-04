"use client";

import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-stone-50">
      <NavBar />
      <main className="flex flex-1 flex-col px-4 pb-6 pt-[4.25rem]">
        {children}
      </main>
    </div>
  );
}
