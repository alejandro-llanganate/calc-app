"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AmountInput, isValidAmount } from "@/components/AmountInput";
import { useAppData } from "@/context/AppDataProvider";
import { formatMoney, parseAmountInput } from "@/lib/format";
import { generateId } from "@/lib/storage";
import type { Product } from "@/lib/types";

export default function ProductosPage() {
  const { ready, settings, products, setProducts } = useAppData();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const symbol = settings.currencySymbol;
  const barcodeEnabled = settings.features.barcodeScanner;

  const addProduct = () => {
    const trimmed = name.trim();
    const p = parseAmountInput(price);
    if (!trimmed || p == null) return;

    const product: Product = {
      id: generateId(),
      name: trimmed,
      price: p,
    };
    setProducts([product, ...products]);
    setName("");
    setPrice("");
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
        <p className="text-sm text-stone-600">
          Catálogo opcional. Si activas nombres en caja, aquí puedes definir
          precios y el sistema sugerirá productos al registrar ventas.
        </p>

        {barcodeEnabled && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
            Escáner habilitado en ajustes — la lectura de códigos llegará en la
            fase 2.
          </div>
        )}

        <form
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            addProduct();
          }}
        >
          <label className="block">
            <span className="text-sm text-stone-600">Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-3 text-lg"
              placeholder="Ej. Arroz 1kg"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-600">Precio</span>
            <div className="mt-1 rounded-xl border border-stone-200 px-3 py-3">
              <AmountInput
                value={price}
                onChange={setPrice}
                symbol={symbol}
                placeholder="0"
              />
            </div>
            <p className="mt-1 text-xs text-stone-400">
              Usa coma para decimales (ej. 12,50)
            </p>
          </label>
          <button
            type="submit"
            disabled={!name.trim() || !isValidAmount(price)}
            className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white active:bg-emerald-700 disabled:bg-stone-300"
          >
            Agregar producto
          </button>
        </form>

        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {products.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-stone-500">
              Sin productos aún
            </li>
          ) : (
            products.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-stone-500">
                    {formatMoney(p.price, symbol)}
                    {p.barcode ? ` · ${p.barcode}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(p.id)}
                  className="text-sm text-red-600"
                >
                  Eliminar
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}
