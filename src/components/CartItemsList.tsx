"use client";

import type { PurchaseItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Props = {
  items: PurchaseItem[];
  currencySymbol: string;
  onRemove?: (id: string) => void;
  variant?: "default" | "microsoft";
};

export function CartItemsList({
  items,
  currencySymbol,
  onRemove,
  variant = "default",
}: Props) {
  if (items.length === 0) {
    return (
      <p
        className={`py-4 text-center ${
          variant === "microsoft"
            ? "text-base text-[var(--calc-muted)]"
            : "text-sm text-stone-500"
        }`}
      >
        Escribe un monto y pulsa + para sumar artículos.
      </p>
    );
  }

  return (
    <ul
      className={
        variant === "microsoft"
          ? "divide-y divide-[var(--calc-border)]"
          : "divide-y divide-stone-100"
      }
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-2 py-3"
        >
          <div className="min-w-0">
            {item.note ? (
              <>
                <p className="text-base text-[#1a1a1a]">{item.note}</p>
                <p className="text-lg font-medium tabular-nums text-[#1a1a1a]">
                  {formatMoney(item.amount, currencySymbol)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--calc-muted)]">
                  Artículo {index + 1}
                </p>
                <p className="text-lg font-medium tabular-nums text-[#1a1a1a]">
                  {formatMoney(item.amount, currencySymbol)}
                </p>
              </>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="shrink-0 px-2 py-1 text-sm text-[var(--calc-accent)] hover:underline"
            >
              Quitar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
