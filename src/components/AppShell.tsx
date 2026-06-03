"use client";

import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-stone-50 px-4 pt-4">
      {children}
      <NavBar />
    </div>
  );
}
