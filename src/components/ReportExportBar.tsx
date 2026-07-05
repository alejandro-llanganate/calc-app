"use client";

import { Download, MessageCircle } from "lucide-react";

export function ReportExportBar({
  onDownloadPdf,
  onShareFullWhatsApp,
  disabled,
  compact,
}: {
  onDownloadPdf: () => void;
  onShareFullWhatsApp: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton
          icon={Download}
          label="PDF"
          onClick={onDownloadPdf}
          disabled={disabled}
          variant="primary"
          compact
        />
        <ActionButton
          icon={MessageCircle}
          label="WhatsApp"
          onClick={onShareFullWhatsApp}
          disabled={disabled}
          variant="whatsapp"
          compact
        />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-[#1a1a1a]">Exportar reportes</h2>
      <p className="mt-1 text-xs text-[var(--calc-muted)]">
        Descarga el resumen en PDF o compártelo por WhatsApp.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionButton
          icon={Download}
          label="Descargar PDF"
          onClick={onDownloadPdf}
          disabled={disabled}
          variant="primary"
        />
        <ActionButton
          icon={MessageCircle}
          label="Compartir todo por WhatsApp"
          onClick={onShareFullWhatsApp}
          disabled={disabled}
          variant="whatsapp"
        />
      </div>
    </section>
  );
}

export function ChartShareButtons({
  onShareWhatsApp,
  disabled,
}: {
  onShareWhatsApp: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onShareWhatsApp}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--calc-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--calc-accent)] disabled:opacity-40 hover:bg-[#f3f2f1]"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      WhatsApp
    </button>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant,
  compact,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "whatsapp";
  compact?: boolean;
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--calc-accent)] text-white hover:bg-[var(--calc-accent-hover)]"
      : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-lg font-medium disabled:opacity-40 ${styles} ${
        compact ? "px-4 py-2 text-sm" : "min-w-[9rem] flex-1 px-3 py-2.5 text-sm"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
