"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AmountInput, isValidAmount } from "@/components/AmountInput";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { useAppData } from "@/context/AppDataProvider";
import { formatMoney, parseAmountInput } from "@/lib/format";
import {
  findProductByBarcode,
  normalizeBarcode,
} from "@/lib/products";
import { generateId } from "@/lib/storage";
import type { Product } from "@/lib/types";

export default function ProductosPage() {
  const { ready, settings, products, setProducts } = useAppData();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [formError, setFormError] = useState("");

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const symbol = settings.currencySymbol;

  const addProduct = () => {
    const trimmed = name.trim();
    const p = parseAmountInput(price);
    const code = normalizeBarcode(barcode);

    if (!trimmed || p == null) return;

    if (code && findProductByBarcode(products, code)) {
      setFormError("Ya existe un producto con ese código de barras.");
      return;
    }

    const product: Product = {
      id: generateId(),
      name: trimmed,
      price: p,
      ...(code ? { barcode: code } : {}),
    };
    setProducts([product, ...products]);
    setName("");
    setPrice("");
    setBarcode("");
    setFormError("");
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
        <p className="text-sm text-stone-600">
          Catálogo con nombre, precio y código de barras. Escanea con la cámara
          o escribe el código manualmente; todo se guarda en este dispositivo.
        </p>

        <form
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
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
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej. Arroz 1kg"
            />
          </label>

          <label className="block">
            <span className="text-sm text-stone-600">Código de barras</span>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setFormError("");
                }}
                className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-3 font-mono text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Opcional — EAN, UPC…"
              />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-3 text-sm font-medium text-white active:bg-violet-700"
              >
                <ScanBarcode className="h-5 w-5" />
                Escanear
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              También puedes usar un lector USB: enfoca el campo y escanea.
            </p>
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

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

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
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-stone-500">
                    {formatMoney(p.price, symbol)}
                  </p>
                  {p.barcode && (
                    <p className="mt-0.5 truncate font-mono text-xs text-violet-600">
                      {p.barcode}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(p.id)}
                  className="shrink-0 text-sm text-red-600"
                >
                  Eliminar
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setBarcode(normalizeBarcode(code));
          setFormError("");
        }}
      />
    </AppShell>
  );
}
