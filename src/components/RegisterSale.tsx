"use client";

import { useCallback, useMemo, useState } from "react";
import { CalculatorKeypad } from "./CalculatorKeypad";
import { CartItemsList } from "./CartItemsList";
import { PurchaseHistoryList } from "./PurchaseHistoryList";
import { AmountInput, isValidAmount } from "./AmountInput";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";
import { ProductSuggestions } from "./ProductSuggestions";
import { ScrollToTopButton } from "./ScrollToTopButton";
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

const CAJA_TOP_ID = "caja-top";

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
      { id: generateId(), amount, note, productId },
    ]);
    setInput("");
    setItemName("");
  }, [input, detailMode, itemName, saveToCatalog, upsertProduct, products]);

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

  const scrollToCaja = () => {
    document.getElementById(CAJA_TOP_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div id={CAJA_TOP_ID} className="scroll-mt-[4.5rem] space-y-3">
        <header className="flex items-center justify-between gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-white">
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
                Guardar en catálogo
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
            <div className="mt-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Compra actual
              </p>
              <div className="mt-0.5 flex items-baseline justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums text-emerald-800 sm:text-3xl">
                  {formatMoney(cartTotal, symbol)}
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {cartItems.length}{" "}
                  {cartItems.length === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
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

      <section
        id="detalle-compra"
        className="scroll-mt-[4.5rem] space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-lg font-semibold text-stone-900">
            Detalle de la compra
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Artículos en curso y compras finalizadas hoy
          </p>
          <button
            type="button"
            onClick={scrollToCaja}
            className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-800 active:bg-emerald-100"
          >
            ↑ Volver a la calculadora
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-700">
              Artículos en la compra
            </h3>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-600"
              >
                Vaciar
              </button>
            )}
          </div>
          {cartItems.length > 0 && (
            <p className="mb-2 text-xl font-bold text-emerald-700">
              {formatMoney(cartTotal, symbol)}
            </p>
          )}
          <CartItemsList
            items={cartItems}
            currencySymbol={symbol}
            onRemove={removeCartItem}
          />
        </div>

        <div className="border-t border-stone-100 pt-4">
          <h3 className="mb-2 text-sm font-medium text-stone-700">
            Compras de hoy
          </h3>
          <PurchaseHistoryList
            purchases={todayPurchases}
            currencySymbol={symbol}
            onRemove={removePurchase}
          />
        </div>
      </section>

      <ScrollToTopButton targetId={CAJA_TOP_ID} label="Caja" />
    </div>
  );
}
