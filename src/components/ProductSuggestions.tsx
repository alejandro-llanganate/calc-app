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
      <p className="text-xs text-stone-500">Sugerencias del catálogo</p>
      <ul className="flex flex-wrap gap-2">
        {products.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-sm text-emerald-900 active:bg-emerald-100"
            >
              <span className="font-medium">{p.name}</span>
              <span className="ml-1.5 text-emerald-700">
                {formatMoney(p.price, currencySymbol)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
