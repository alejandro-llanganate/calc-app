import { supabase } from "@/lib/supabase/client";

export function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function probeSupabase(): Promise<boolean> {
  if (!isBrowserOnline()) return false;

  try {
    const { error } = await supabase.from("stores").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
