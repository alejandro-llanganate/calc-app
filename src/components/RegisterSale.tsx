"use client";

import { useCallback, useMemo, useState } from "react";
import { CalculatorKeypad } from "./CalculatorKeypad";
import { CartItemsList } from "./CartItemsList";
import { PurchaseHistoryList } from "./PurchaseHistoryList";
import { AmountInput, isValidAmount } from "./AmountInput";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";
import { ProductSuggestions } from "./ProductSuggestions";
import { useAppData } from "@/context/AppDataProvider";
import {
  appendAmountDecimal,
  appendAmountDigit,
  backspaceAmount,
  formatMoney,
  numberToAmountInput,
  parseAmountInput,
} from "@/lib/format";
import { findProductByName, suggestProducts } from "@/lib/products";
import { generateId, purchaseTotal } from "@/lib/storage";
import type { PurchaseItem, Product } from "@/lib/types";
import { useCalculatorKeyboard } from "@/hooks/useCalculatorKeyboard";
import { ChevronDown, ChevronUp } from "lucide-react";

export function RegisterSale() {
  const {
    settings,
    products,
    todayPurchases,
    todayTotal,
    finalizePurchase,
    removePurchase,
    upsertProduct,
    toggleItemDetails,
  } = useAppData();

  const [input, setInput] = useState("");
  const [itemName, setItemName] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [cartItems, setCartItems] = useState<PurchaseItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [flash, setFlash] = useState(false);

  const symbol = settings.currencySymbol;
  const cartTotal = purchaseTotal(cartItems);
  const detailMode = settings.features.itemDetails;
  const parsedAmount = parseAmountInput(input);

  const suggestions = useMemo(() => {
    if (!detailMode) return [];
    return suggestProducts(products, {
      amount: parsedAmount,
      nameQuery: itemName,
    });
  }, [detailMode, products, parsedAmount, itemName]);

  const onDigit = useCallback((digit: string) => {
    setInput((prev) => appendAmountDigit(prev, digit));
  }, []);

  const onDecimal = useCallback(() => {
    setInput((prev) => appendAmountDecimal(prev));
  }, []);

  const onBackspace = useCallback(() => {
    setInput((prev) => backspaceAmount(prev));
  }, []);

  const onClear = useCallback(() => {
    setInput("");
    setItemName("");
  }, []);

  const applyProduct = useCallback((product: Product) => {
    setItemName(product.name);
    setInput(numberToAmountInput(product.price));
  }, []);

  const addItem = useCallback(() => {
    const amount = parseAmountInput(input);
    if (amount == null) return;

    const name = detailMode ? itemName.trim() : "";
    let productId: string | undefined;
    let note: string | undefined;

    if (detailMode && name) {
      note = name;
      if (saveToCatalog) {
        const saved = upsertProduct(name, amount);
        productId = saved.id;
      } else {
        productId = findProductByName(products, name)?.id;
      }
    }

    setCartItems((prev) => [
      ...prev,
      {
        id: generateId(),
        amount,
        note,
        productId,
      },
    ]);
    setInput("");
    setItemName("");
  }, [
    input,
    detailMode,
    itemName,
    saveToCatalog,
    upsertProduct,
    products,
  ]);

  const removeCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setInput("");
    setItemName("");
  }, []);

  const finishPurchase = useCallback(() => {
    if (cartItems.length === 0) return;
    finalizePurchase(cartItems);
    setCartItems([]);
    setInput("");
    setItemName("");
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  }, [cartItems, finalizePurchase]);

  useCalculatorKeyboard({
    onDigit,
    onDecimal,
    onBackspace,
    onClear,
    onEnter: addItem,
  });

  const canAdd = isValidAmount(input);

  return (
    <div className="flex flex-1 flex-col gap-3 pb-24">
      <header className="flex shrink-0 items-center justify-between gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-emerald-100">
            {settings.storeName}
          </p>
          <p
            className={`text-base font-semibold leading-tight transition-transform ${flash ? "scale-105" : ""}`}
          >
            {formatMoney(todayTotal, symbol)}
            <span className="ml-1.5 text-xs font-normal text-emerald-200">
              · {todayPurchases.length}{" "}
              {todayPurchases.length === 1 ? "compra" : "compras"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleItemDetails(!detailMode)}
          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
            detailMode
              ? "bg-white text-emerald-800"
              : "bg-emerald-600/80 text-emerald-100 ring-1 ring-emerald-500/60"
          }`}
        >
          {detailMode ? "Detalle ON" : "Detalle OFF"}
        </button>
      </header>

      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-stone-50 px-4 pb-3 pt-1">
        <section
          className={`rounded-2xl border-2 bg-white px-4 py-4 shadow-sm transition-colors ${
            flash ? "border-emerald-400" : "border-stone-200"
          }`}
        >
          {detailMode && (
            <div className="mb-3 space-y-2 border-b border-stone-100 pb-3">
              <label className="block">
                <span className="text-xs text-stone-500">
                  Nombre del producto (opcional)
                </span>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ej. Arroz 1kg"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600"
                />
                Guardar en catálogo (para sugerir después)
              </label>
            </div>
          )}

          <p className="mb-1 text-xs text-stone-500">Monto</p>
          <AmountInput
            id={AMOUNT_INPUT_ID}
            value={input}
            onChange={setInput}
            onDigit={onDigit}
            onDecimal={onDecimal}
            onBackspace={onBackspace}
            onEnter={addItem}
            symbol={symbol}
            size="lg"
            placeholder="0"
            autoFocus
          />
          <p className="mt-1 text-[10px] text-stone-400">
            Teclado: números, coma o punto, Enter para sumar, Esc para borrar
          </p>

          {detailMode && suggestions.length > 0 && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <ProductSuggestions
                products={suggestions}
                currencySymbol={symbol}
                onSelect={applyProduct}
              />
            </div>
          )}

          {cartItems.length > 0 && (
            <p className="mt-2 text-sm text-emerald-700">
              Compra actual: {formatMoney(cartTotal, symbol)} ·{" "}
              {cartItems.length}{" "}
              {cartItems.length === 1 ? "artículo" : "artículos"}
            </p>
          )}
        </section>

        <CalculatorKeypad
          onDigit={onDigit}
          onDecimal={onDecimal}
          onBackspace={onBackspace}
          onClear={onClear}
          onAddItem={addItem}
          addDisabled={!canAdd}
        />

        <button
          type="button"
          onClick={finishPurchase}
          disabled={cartItems.length === 0}
          className="w-full rounded-2xl bg-stone-900 py-3.5 text-lg font-semibold text-white active:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500"
        >
          Finalizar compra
        </button>
      </div>

      {!detailMode && (
        <p className="text-center text-xs text-stone-500">
          Modo rápido: solo monto y +. Activa Detalle para nombres y sugerencias.
        </p>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">
              Artículos en la compra
            </p>
            {cartItems.length > 0 && (
              <p className="mt-0.5 text-lg font-bold text-emerald-700">
                {formatMoney(cartTotal, symbol)}
              </p>
            )}
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Vaciar
            </button>
          )}
        </div>
        <div className="mt-2 max-h-52 overflow-y-auto border-t border-stone-100 pt-2">
          <CartItemsList
            items={cartItems}
            currencySymbol={symbol}
            onRemove={removeCartItem}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700"
        >
          <span>Compras de hoy</span>
          {showHistory ? (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          )}
        </button>
        {showHistory && (
          <div className="border-t border-stone-100 px-4 pb-3">
            <PurchaseHistoryList
              purchases={todayPurchases}
              currencySymbol={symbol}
              onRemove={removePurchase}
            />
          </div>
        )}
      </section>
    </div>
  );
}
