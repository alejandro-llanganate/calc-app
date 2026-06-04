"use client";

import { Download, MessageCircle } from "lucide-react";

export function ReportExportBar({
  onDownloadPdf,
  onShareFullWhatsApp,
  disabled,
}: {
  onDownloadPdf: () => void;
  onShareFullWhatsApp: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-semibold text-stone-900">Exportar reportes</h2>
      <p className="mt-1 text-xs text-stone-500">
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
      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-40 active:bg-emerald-100"
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
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "whatsapp";
}) {
  const styles =
    variant === "primary"
      ? "bg-stone-900 text-white active:bg-stone-800"
      : "border border-emerald-300 bg-emerald-50 text-emerald-800 active:bg-emerald-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 min-w-[9rem] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:opacity-40 ${styles}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
