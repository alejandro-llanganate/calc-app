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
      className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg active:bg-emerald-800"
    >
      <ArrowUp className="h-4 w-4" />
      {label}
    </button>
  );
}
