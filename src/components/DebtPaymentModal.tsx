"use client";

import { useEffect, useState } from "react";
import type { Debt } from "@/lib/types";
import { debtPendingAmount } from "@/lib/debts";
import { AmountInput, isValidAmount } from "./AmountInput";
import { formatMoney, parseAmountInput } from "@/lib/format";

type Props = {
  open: boolean;
  debt: Debt | null;
  currencySymbol: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  onPayFull: () => void;
};

export function DebtPaymentModal({
  open,
  debt,
  currencySymbol,
  onClose,
  onSubmit,
  onPayFull,
}: Props) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
    }
  }, [open, debt?.id]);

  if (!open || !debt) return null;

  const pending = debtPendingAmount(debt);

  const submit = () => {
    const value = parseAmountInput(amount);
    if (value == null || value <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (value > pending) {
      setError(`El abono no puede superar ${formatMoney(pending, currencySymbol)}.`);
      return;
    }
    onSubmit(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--calc-border)] bg-white shadow-xl">
        <div className="border-b border-[var(--calc-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Registrar abono</h2>
          <p className="mt-1 text-sm text-[var(--calc-muted)]">{debt.debtorName}</p>
          <p className="mt-2 text-sm text-[var(--calc-muted)]">
            Total: {formatMoney(debt.amount, currencySymbol)} · Pendiente:{" "}
            <span className="font-medium text-orange-600">
              {formatMoney(pending, currencySymbol)}
            </span>
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="text-sm text-[var(--calc-muted)]">Monto del abono</span>
            <div className="mt-1 rounded-lg border border-[var(--calc-border)] px-3 py-2">
              <AmountInput
                value={amount}
                onChange={setAmount}
                symbol={currencySymbol}
                placeholder="0"
              />
            </div>
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onPayFull}
            className="w-full rounded-lg border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-800"
          >
            Pagar total ({formatMoney(pending, currencySymbol)})
          </button>
        </div>
        <div className="flex gap-2 border-t border-[var(--calc-border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--calc-border)] py-3 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!isValidAmount(amount)}
            className="flex-1 rounded-lg bg-[var(--calc-accent)] py-3 text-sm font-medium text-white disabled:bg-[#c8c6c4]"
          >
            Registrar abono
          </button>
        </div>
      </div>
    </div>
  );
}
