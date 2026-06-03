"use client";

import { AppDataProvider } from "@/context/AppDataProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppDataProvider>{children}</AppDataProvider>;
}
