"use client";

import { useState } from "react";
import { AmountInput, isValidAmount } from "./AmountInput";
import { useAppData } from "@/context/AppDataProvider";
import { parseAmountInput } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddDebtModal({ open, onClose }: Props) {
  const { settings, addDebt, activeUser } = useAppData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const symbol = settings.currencySymbol;

  const submit = () => {
    const trimmed = name.trim();
    const value = parseAmountInput(amount);
    if (!trimmed) {
      setError("Escribe el nombre de quien debe.");
      return;
    }
    if (value == null) {
      setError("Ingresa un monto válido.");
      return;
    }
    addDebt(trimmed, value, note);
    setName("");
    setAmount("");
    setNote("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--calc-border)] bg-white shadow-xl">
        <div className="border-b border-[var(--calc-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Registrar debe</h2>
          <p className="mt-1 text-sm text-[var(--calc-muted)]">
            {activeUser
              ? `Registrado por ${activeUser.name}`
              : "Selecciona un usuario en la caja"}
          </p>
        </div>
        <form
          className="space-y-3 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="block">
            <span className="text-sm text-[var(--calc-muted)]">
              Nombre de quien debe
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Ej. Juan Pérez"
              className="mt-1 w-full border border-[var(--calc-border)] px-3 py-2.5 text-base outline-none focus:border-[var(--calc-accent)]"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--calc-muted)]">Monto</span>
            <div className="mt-1 border border-[var(--calc-border)] px-3 py-2">
              <AmountInput
                value={amount}
                onChange={setAmount}
                symbol={symbol}
                placeholder="0"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-[var(--calc-muted)]">
              Nota (opcional)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Fiado del viernes"
              className="mt-1 w-full border border-[var(--calc-border)] px-3 py-2 text-sm outline-none focus:border-[var(--calc-accent)]"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--calc-border)] py-3 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !isValidAmount(amount)}
              className="flex-1 rounded-lg bg-[var(--calc-accent)] py-3 text-sm font-medium text-white disabled:bg-[#c8c6c4]"
            >
              Guardar debe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
