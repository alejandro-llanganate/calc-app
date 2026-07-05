"use client";

import Link from "next/link";
import { ArrowLeft, Calculator, Wallet } from "lucide-react";

type Props = {
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: "debe" | "caja";
};

export function PageNav({
  backHref = "/",
  backLabel = "Volver a la calculadora",
  actionHref,
  actionLabel,
  actionIcon,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--calc-border)] bg-white px-4 py-2.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-[#f3f2f1]"
      >
        <ArrowLeft className="h-4 w-4 text-[var(--calc-muted)]" />
        {backLabel}
      </Link>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
            actionIcon === "debe"
              ? "bg-[#fff4ce] text-[#835c00] hover:bg-[#ffecb3]"
              : "bg-[var(--calc-accent)] text-white hover:bg-[var(--calc-accent-hover)]"
          }`}
        >
          {actionIcon === "debe" ? (
            <Wallet className="h-4 w-4" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
