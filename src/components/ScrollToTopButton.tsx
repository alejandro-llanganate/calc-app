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
      className="fixed bottom-5 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(5,150,105,0.45)] transition-transform active:scale-90"
    >
      <ArrowUp className="h-4 w-4" />
      {label}
    </button>
  );
}
