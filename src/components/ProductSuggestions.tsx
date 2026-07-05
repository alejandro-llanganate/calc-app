"use client";

import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Props = {
  products: Product[];
  currencySymbol: string;
  onSelect: (product: Product) => void;
};

export function ProductSuggestions({
  products,
  currencySymbol,
  onSelect,
}: Props) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-[var(--calc-muted)]">
        Sugerencias del catálogo
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {products.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="border border-[var(--calc-border)] bg-white px-2.5 py-1 text-left text-xs text-[#1a1a1a] hover:bg-[#f3f2f1] active:bg-[#edebe9]"
            >
              <span>{p.name}</span>
              <span className="ml-1.5 text-[var(--calc-muted)]">
                {formatMoney(p.price, currencySymbol)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
