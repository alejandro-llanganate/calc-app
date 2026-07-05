"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { Purchase, PurchaseItem } from "@/lib/types";
import {
  formatDateTimeFull,
  formatMoney,
  numberToAmountInput,
  parseAmountInput,
} from "@/lib/format";

type Props = {
  purchases: Purchase[];
  currencySymbol: string;
  onRemove?: (id: string) => void;
  onUpdate?: (id: string, items: PurchaseItem[]) => void;
  compact?: boolean;
  variant?: "default" | "microsoft";
};

export function PurchaseHistoryList({
  purchases,
  currencySymbol,
  onRemove,
  onUpdate,
  compact,
  variant = "default",
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<PurchaseItem[]>([]);
  const isMs = variant === "microsoft";

  if (purchases.length === 0) {
    return (
      <p
        className={`py-6 text-center ${
          isMs
            ? "text-base text-[var(--calc-muted)]"
            : "text-sm text-stone-500"
        }`}
      >
        Aún no hay compras finalizadas hoy.
      </p>
    );
  }

  const startEdit = (purchase: Purchase) => {
    setEditingId(purchase.id);
    setExpandedId(purchase.id);
    setDraftItems(purchase.items.map((item) => ({ ...item })));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftItems([]);
  };

  const saveEdit = (purchaseId: string) => {
    const valid = draftItems.filter((item) => parseAmountInput(numberToAmountInput(item.amount)) != null);
    if (valid.length === 0 || !onUpdate) return;
    onUpdate(purchaseId, valid);
    cancelEdit();
  };

  const updateDraftItem = (
    itemId: string,
    patch: Partial<Pick<PurchaseItem, "note" | "amount">>,
  ) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  };

  return (
    <ul
      className={`${isMs ? "divide-y divide-[var(--calc-border)]" : "divide-y divide-stone-100"} ${compact ? "" : ""}`}
    >
      {purchases.map((purchase) => {
        const expanded = expandedId === purchase.id;
        const editing = editingId === purchase.id;
        const items = editing ? draftItems : purchase.items;

        return (
          <li key={purchase.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  !editing &&
                  setExpandedId(expanded ? null : purchase.id)
                }
                className="min-w-0 flex-1 text-left"
              >
                {isMs ? (
                  <>
                    <p className="text-sm capitalize text-[var(--calc-muted)]">
                      {formatDateTimeFull(purchase.createdAt)}
                    </p>
                    {purchase.registeredBy && (
                      <p className="mt-0.5 text-sm font-medium text-[var(--calc-accent)]">
                        {purchase.registeredBy}
                      </p>
                    )}
                    <p className="mt-1 text-2xl font-normal tabular-nums text-[#1a1a1a]">
                      {formatMoney(
                        editing ? draftItems.reduce((s, i) => s + i.amount, 0) : purchase.total,
                        currencySymbol,
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--calc-muted)]">
                      {purchase.items.length}{" "}
                      {purchase.items.length === 1 ? "artículo" : "artículos"}
                      {!editing && (expanded ? " · ocultar" : " · ver detalle")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-stone-900">
                      {formatMoney(purchase.total, currencySymbol)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDateTimeFull(purchase.createdAt)}
                    </p>
                  </>
                )}
              </button>
              <div className="flex shrink-0 flex-col gap-1">
                {onUpdate && !editing && (
                  <button
                    type="button"
                    onClick={() => startEdit(purchase)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--calc-accent)] hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
                {onRemove && !editing && (
                  <button
                    type="button"
                    onClick={() => onRemove(purchase.id)}
                    className={`px-2 py-1 text-xs ${
                      isMs
                        ? "text-red-600 hover:underline"
                        : "rounded-lg text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {(expanded || editing) && (
              <div className="mt-3 rounded-lg bg-[#faf9f8] p-3">
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {editing ? (
                        <>
                          <input
                            type="text"
                            value={item.note ?? ""}
                            onChange={(e) =>
                              updateDraftItem(item.id, { note: e.target.value })
                            }
                            placeholder={`Artículo ${i + 1}`}
                            className="min-w-0 flex-1 rounded border border-[var(--calc-border)] bg-white px-2 py-1.5 text-sm"
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            value={numberToAmountInput(item.amount)}
                            onChange={(e) => {
                              const amount = parseAmountInput(e.target.value);
                              if (amount != null) {
                                updateDraftItem(item.id, { amount });
                              }
                            }}
                            className="w-full rounded border border-[var(--calc-border)] bg-white px-2 py-1.5 text-right text-base font-medium tabular-nums sm:w-28"
                          />
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 text-base text-[#1a1a1a]">
                            {item.note || `Artículo ${i + 1}`}
                          </span>
                          <span className="shrink-0 text-lg font-medium tabular-nums text-[#1a1a1a]">
                            {formatMoney(item.amount, currencySymbol)}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                {editing && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--calc-border)] py-2 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(purchase.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--calc-accent)] py-2 text-sm text-white"
                    >
                      <Check className="h-4 w-4" />
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
