"use client";

import type { CashierUser } from "@/lib/types";

type Props = {
  open: boolean;
  users: CashierUser[];
  title?: string;
  onSelect: (user: CashierUser) => void;
  onClose?: () => void;
  required?: boolean;
};

export function UserPickerModal({
  open,
  users,
  title = "¿Quién registra?",
  onSelect,
  onClose,
  required = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--calc-border)] bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-picker-title"
      >
        <h2
          id="user-picker-title"
          className="text-lg font-semibold text-[#1a1a1a]"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--calc-muted)]">
          Elige tu nombre para registrar ventas en la caja.
        </p>
        <ul className="mt-4 space-y-2">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                className="w-full rounded-lg border border-[var(--calc-border)] bg-[#faf9f8] px-4 py-3.5 text-left transition-colors hover:border-[var(--calc-accent)] hover:bg-[#deecf9] active:bg-[#deecf9]"
              >
                <span className="block text-base font-medium text-[#1a1a1a]">
                  {user.name}
                </span>
                {user.cedula && (
                  <span className="mt-0.5 block font-mono text-sm text-[var(--calc-muted)]">
                    Cédula: {user.cedula}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {!required && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full py-2 text-sm text-[var(--calc-muted)] hover:text-[#1a1a1a]"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
