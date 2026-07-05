"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

type Props = {
  targetId: string;
  label?: string;
};

export function ScrollToTopButton({
  targetId,
  label = "Ir arriba",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 280);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }}
      className="fixed bottom-5 right-4 z-40 flex h-11 items-center gap-2 rounded bg-[var(--calc-accent)] px-4 text-sm font-medium text-white shadow-[0_4px_12px_rgba(0,120,212,0.35)] transition-transform active:scale-95"
    >
      <ArrowUp className="h-4 w-4" />
      {label}
    </button>
  );
}
