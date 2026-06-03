"use client";

import { useState } from "react";
import type { Purchase } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";

type Props = {
  purchases: Purchase[];
  currencySymbol: string;
  onRemove?: (id: string) => void;
  compact?: boolean;
};

export function PurchaseHistoryList({
  purchases,
  currencySymbol,
  onRemove,
  compact,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (purchases.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-stone-500">
        Aún no hay compras finalizadas hoy.
      </p>
    );
  }

  return (
    <ul
      className={`divide-y divide-stone-100 ${compact ? "" : "max-h-56 overflow-y-auto"}`}
    >
      {purchases.map((purchase) => {
        const expanded = expandedId === purchase.id;
        return (
          <li key={purchase.id} className="py-2.5">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expanded ? null : purchase.id)
                }
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-medium text-stone-900">
                  {formatMoney(purchase.total, currencySymbol)}
                </p>
                <p className="text-xs text-stone-500">
                  {formatDateTime(purchase.createdAt)}
                </p>
                <p className="mt-0.5 text-xs text-stone-400">
                  {purchase.items.length}{" "}
                  {purchase.items.length === 1 ? "artículo" : "artículos"}
                  {expanded ? " ▲" : " ▼"}
                </p>
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(purchase.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Quitar
                </button>
              )}
            </div>
            {expanded && (
              <ul className="mt-2 space-y-1 rounded-lg bg-stone-50 px-3 py-2">
                {purchase.items.map((item, i) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-2 text-sm text-stone-700"
                  >
                    <span className="min-w-0 truncate">
                      {item.note || `Artículo ${i + 1}`}
                    </span>
                    <span className="shrink-0">
                      {formatMoney(item.amount, currencySymbol)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
