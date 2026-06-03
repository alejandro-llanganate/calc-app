"use client";

import type { PurchaseItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Props = {
  items: PurchaseItem[];
  currencySymbol: string;
  onRemove?: (id: string) => void;
  showNames?: boolean;
};

export function CartItemsList({
  items,
  currencySymbol,
  onRemove,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-stone-500">
        Escribe un monto y pulsa + para sumar artículos.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-100">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-2 py-2.5"
        >
          <div className="min-w-0">
            {item.note ? (
              <>
                <p className="font-medium text-stone-900">{item.note}</p>
                <p className="text-sm text-stone-600">
                  {formatMoney(item.amount, currencySymbol)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500">Artículo {index + 1}</p>
                <p className="font-medium text-stone-900">
                  {formatMoney(item.amount, currencySymbol)}
                </p>
              </>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Quitar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
