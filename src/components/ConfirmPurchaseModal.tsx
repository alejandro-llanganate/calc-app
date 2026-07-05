"use client";

import { useEffect, useState } from "react";
import type { PaymentMethod, PurchaseItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

type Props = {
  open: boolean;
  items: PurchaseItem[];
  total: number;
  currencySymbol: string;
  registeredBy?: string;
  onAccept: (paymentMethod?: PaymentMethod) => void;
  onCancel: () => void;
};

const PAYMENT_OPTIONS: {
  value: PaymentMethod | undefined;
  label: string;
}[] = [
  { value: undefined, label: "Sin especificar" },
  { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
  { value: "transfer", label: PAYMENT_METHOD_LABELS.transfer },
];

export function ConfirmPurchaseModal({
  open,
  items,
  total,
  currencySymbol,
  registeredBy,
  onAccept,
  onCancel,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(
    undefined,
  );

  useEffect(() => {
    if (open) setPaymentMethod(undefined);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-xl border border-[var(--calc-border)] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="border-b border-[var(--calc-border)] px-5 py-4">
          <h2 id="confirm-title" className="text-lg font-semibold text-[#1a1a1a]">
            ¿El total es correcto?
          </h2>
          {registeredBy && (
            <p className="mt-1 text-sm text-[var(--calc-muted)]">
              Registrado por:{" "}
              <span className="font-medium text-[var(--calc-accent)]">
                {registeredBy}
              </span>
            </p>
          )}
          <p className="mt-3 text-3xl font-light tabular-nums text-[#1a1a1a]">
            {formatMoney(total, currencySymbol)}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
            Forma de pago (opcional)
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const selected = paymentMethod === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-[var(--calc-accent)] bg-[#deecf9] text-[var(--calc-accent)]"
                      : "border-[var(--calc-border)] bg-white text-[#1a1a1a] hover:bg-[#f3f2f1]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--calc-muted)]">
            Detalle
          </p>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-[#faf9f8] px-3 py-2.5"
              >
                <span className="min-w-0 text-sm text-[#1a1a1a]">
                  {item.note || `Artículo ${i + 1}`}
                </span>
                <span className="shrink-0 text-base font-medium tabular-nums text-[#1a1a1a]">
                  {formatMoney(item.amount, currencySymbol)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 border-t border-[var(--calc-border)] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-[var(--calc-border)] py-3 text-sm font-medium text-[#1a1a1a] hover:bg-[#f3f2f1]"
          >
            No, revisar
          </button>
          <button
            type="button"
            onClick={() => onAccept(paymentMethod)}
            className="flex-1 rounded-lg bg-[var(--calc-accent)] py-3 text-sm font-medium text-white hover:bg-[var(--calc-accent-hover)]"
          >
            Sí, aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
