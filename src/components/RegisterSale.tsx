"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalculatorKeypad } from "./CalculatorKeypad";
import { CartItemsList } from "./CartItemsList";
import {
  ActivityHistoryList,
  type ActivityEntry,
} from "./ActivityHistoryList";
import { AmountInput } from "./AmountInput";
import { ConfirmPurchaseModal } from "./ConfirmPurchaseModal";
import { UserPickerModal } from "./UserPickerModal";
import {
  AMOUNT_INPUT_ID,
  applyCalcOperation,
  resolveCalcAmount,
  type CalcOperator,
} from "@/lib/calculator";
import { ProductSuggestions } from "./ProductSuggestions";
import { useAppData } from "@/context/AppDataProvider";
import {
  appendAmountDecimal,
  appendAmountDigit,
  appendAmountDoubleZero,
  backspaceAmount,
  formatMoney,
  numberToAmountInput,
  parseAmountInput,
} from "@/lib/format";
import { findProductByName, suggestProducts } from "@/lib/products";
import { generateId, purchaseDateKey, purchaseTotal } from "@/lib/storage";
import type { PaymentMethod, PurchaseItem, Product } from "@/lib/types";
import { useCalculatorKeyboard } from "@/hooks/useCalculatorKeyboard";

const CAJA_TOP_ID = "caja-top";

type SidePanel = "historial" | "compra";

export function RegisterSale() {
  const {
    settings,
    products,
    todayPurchases,
    todayKey,
    debts,
    cashierUsers,
    activeUser,
    setActiveUser,
    finalizePurchase,
    removePurchase,
    markDebtPaid,
    addDebtPayment,
    removeDebt,
    upsertProduct,
  } = useAppData();

  const [input, setInput] = useState("");
  const [itemName, setItemName] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [cartItems, setCartItems] = useState<PurchaseItem[]>([]);
  const [flash, setFlash] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>("compra");
  const [pendingLeft, setPendingLeft] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<CalcOperator | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const prevDebtsCountRef = useRef(debts.length);

  const todayEntries = useMemo((): ActivityEntry[] => {
    const dayDebts = debts.filter((d) => {
      const created = purchaseDateKey(d.createdAt);
      const paid = d.paidAt ? purchaseDateKey(d.paidAt) : null;
      return created === todayKey || paid === todayKey;
    });

    const list: ActivityEntry[] = [
      ...todayPurchases.map((p) => ({
        kind: "purchase" as const,
        id: p.id,
        at: p.createdAt,
        purchase: p,
      })),
      ...dayDebts.map((d) => ({
        kind: "debt" as const,
        id: d.id,
        at:
          d.paidAt && todayKey === purchaseDateKey(d.paidAt)
            ? d.paidAt
            : d.createdAt,
        debt: d,
      })),
    ];

    return list.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [todayPurchases, debts, todayKey]);

  useEffect(() => {
    if (debts.length > prevDebtsCountRef.current) {
      setSidePanel("historial");
    }
    prevDebtsCountRef.current = debts.length;
  }, [debts.length]);

  const symbol = settings.currencySymbol;
  const cartTotal = purchaseTotal(cartItems);
  const detailMode = settings.features.itemDetails;
  const parsedAmount = parseAmountInput(input);
  const resolvedAmount = resolveCalcAmount(
    input,
    pendingLeft,
    pendingOp,
    parseAmountInput,
  );

  const suggestions = useMemo(() => {
    if (!detailMode) return [];
    return suggestProducts(products, {
      amount: resolvedAmount ?? parsedAmount,
      nameQuery: itemName,
    });
  }, [detailMode, products, resolvedAmount, parsedAmount, itemName]);

  const requireUser = useCallback(() => {
    return activeUser != null;
  }, [activeUser]);

  const resetCalc = useCallback(() => {
    setInput("");
    setItemName("");
    setPendingLeft(null);
    setPendingOp(null);
  }, []);

  const onDigit = useCallback((digit: string) => {
    setInput((prev) => appendAmountDigit(prev, digit));
  }, []);

  const onDecimal = useCallback(() => {
    setInput((prev) => appendAmountDecimal(prev));
  }, []);

  const onDoubleZero = useCallback(() => {
    setInput((prev) => appendAmountDoubleZero(prev));
  }, []);

  const onBackspace = useCallback(() => {
    setInput((prev) => backspaceAmount(prev));
  }, []);

  const onClear = useCallback(() => {
    resetCalc();
  }, [resetCalc]);

  const onMultiply = useCallback(() => {
    const current = parseAmountInput(input);

    if (pendingLeft != null && pendingOp === "multiply" && current != null) {
      const result = applyCalcOperation(pendingLeft, current, "multiply");
      setPendingLeft(result);
      setPendingOp("multiply");
      setInput("");
      return;
    }

    if (current == null) return;

    setPendingLeft(current);
    setPendingOp("multiply");
    setInput("");
  }, [input, pendingLeft, pendingOp]);

  const applyProduct = useCallback((product: Product) => {
    setItemName(product.name);
    setInput(numberToAmountInput(product.price));
    setPendingLeft(null);
    setPendingOp(null);
  }, []);

  const addItem = useCallback(() => {
    if (!requireUser()) return;

    const amount = resolveCalcAmount(
      input,
      pendingLeft,
      pendingOp,
      parseAmountInput,
    );
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
    } else if (pendingLeft != null && pendingOp === "multiply") {
      const right = parseAmountInput(input);
      if (right != null) {
        note = `${numberToAmountInput(pendingLeft)} × ${numberToAmountInput(right)}`;
      }
    }

    setCartItems((prev) => [
      ...prev,
      { id: generateId(), amount, note, productId },
    ]);
    resetCalc();
    setSidePanel("compra");
  }, [
    requireUser,
    input,
    pendingLeft,
    pendingOp,
    detailMode,
    itemName,
    saveToCatalog,
    upsertProduct,
    products,
    resetCalc,
  ]);

  const removeCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    resetCalc();
  }, [resetCalc]);

  const requestFinish = useCallback(() => {
    if (!requireUser() || cartItems.length === 0) return;
    setShowConfirm(true);
  }, [requireUser, cartItems.length]);

  const confirmFinish = useCallback(
    (paymentMethod?: PaymentMethod) => {
      finalizePurchase(cartItems, paymentMethod);
      setCartItems([]);
      resetCalc();
      setShowConfirm(false);
      setFlash(true);
      setSidePanel("historial");
      setTimeout(() => setFlash(false), 400);
    },
    [cartItems, finalizePurchase, resetCalc],
  );

  useCalculatorKeyboard({
    onDigit,
    onDecimal,
    onBackspace,
    onClear,
    onMultiply,
    onEnter: addItem,
    enabled: !!activeUser,
  });

  const canAdd = resolvedAmount != null && !!activeUser;

  const expression = useMemo(() => {
    if (pendingLeft == null || pendingOp !== "multiply") return undefined;
    const left = numberToAmountInput(pendingLeft);
    if (!input) return `${left} ×`;
    return `${left} × ${input}`;
  }, [pendingLeft, pendingOp, input]);

  const displayHint = activeUser
    ? cartItems.length > 0
      ? `${activeUser.name} · ${cartItems.length} ${cartItems.length === 1 ? "artículo" : "artículos"}`
      : pendingLeft != null
        ? "Segundo valor"
        : "Monto del artículo"
    : "Inicia sesión para registrar";

  const displaySecondary =
    cartItems.length > 0 ? formatMoney(cartTotal, symbol) : undefined;

  return (
    <>
      <UserPickerModal
        open={!activeUser}
        users={cashierUsers}
        required
        onSelect={setActiveUser}
      />

      <ConfirmPurchaseModal
        open={showConfirm}
        items={cartItems}
        total={cartTotal}
        currencySymbol={symbol}
        registeredBy={activeUser?.name}
        onAccept={confirmFinish}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section
          id={CAJA_TOP_ID}
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden border-[var(--calc-border)] bg-[var(--calc-surface)] transition-shadow lg:min-w-0 lg:border-r lg:border-t-0 lg:border-b-0 lg:border-l-0 ${
            flash ? "ring-2 ring-[var(--calc-accent)]" : "border-b lg:shadow-none"
          } ${
            !activeUser ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {detailMode && (
            <div className="shrink-0 space-y-2 border-b border-[var(--calc-border)] bg-[#faf9f8] px-3 py-2.5 lg:px-5">
              <label className="block">
                <span className="text-[11px] text-[var(--calc-muted)]">
                  Nombre del producto (opcional)
                </span>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ej. Arroz 1kg"
                  disabled={!activeUser}
                  className="mt-1 w-full border border-[var(--calc-border)] bg-white px-2.5 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[var(--calc-accent)] disabled:opacity-50"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--calc-muted)]">
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  disabled={!activeUser}
                  className="h-3.5 w-3.5 rounded-sm border-[var(--calc-border)] text-[var(--calc-accent)]"
                />
                Guardar en catálogo
              </label>
              {suggestions.length > 0 && (
                <ProductSuggestions
                  products={suggestions}
                  currencySymbol={symbol}
                  onSelect={applyProduct}
                />
              )}
            </div>
          )}

          <AmountInput
            id={AMOUNT_INPUT_ID}
            value={input}
            onChange={setInput}
            onDigit={onDigit}
            onDecimal={onDecimal}
            onBackspace={onBackspace}
            onEnter={addItem}
            symbol={symbol}
            variant="microsoft"
            placeholder="0"
            autoFocus={!!activeUser}
            hint={displayHint}
            secondary={displaySecondary}
            expression={expression}
            className="shrink-0"
          />

          <CalculatorKeypad
            className="min-h-0 flex-1"
            onDigit={onDigit}
            onDecimal={onDecimal}
            onDoubleZero={onDoubleZero}
            onBackspace={onBackspace}
            onClear={onClear}
            onMultiply={onMultiply}
            onAddItem={addItem}
            onFinish={requestFinish}
            addDisabled={!canAdd}
            finishDisabled={cartItems.length === 0 || !activeUser}
            multiplyActive={pendingOp === "multiply"}
          />
        </section>

        <aside className="flex h-[min(42dvh,22rem)] min-h-0 shrink-0 flex-col overflow-hidden border-t border-[var(--calc-border)] bg-[var(--calc-surface)] lg:h-auto lg:w-[min(400px,36%)] lg:max-w-md lg:shrink-0 lg:border-t-0 lg:border-l lg:border-[var(--calc-border)]">
          <div className="flex shrink-0 border-b border-[var(--calc-border)]">
            <TabButton
              active={sidePanel === "historial"}
              onClick={() => setSidePanel("historial")}
            >
              Historial
            </TabButton>
            <TabButton
              active={sidePanel === "compra"}
              onClick={() => setSidePanel("compra")}
            >
              Compra actual
              {cartItems.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--calc-accent)] px-1.5 py-0.5 text-[10px] text-white">
                  {cartItems.length}
                </span>
              )}
            </TabButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            {sidePanel === "historial" ? (
              <ActivityHistoryList
                entries={todayEntries}
                currencySymbol={symbol}
                compact
                onRemovePurchase={removePurchase}
                onAddDebtPayment={addDebtPayment}
                onMarkDebtPaid={markDebtPaid}
                onRemoveDebt={removeDebt}
                emptyMessage="Aún no hay ventas ni debes registrados hoy."
              />
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  {cartItems.length > 0 ? (
                    <>
                      <p className="text-lg font-medium tabular-nums text-[#1a1a1a]">
                        {formatMoney(cartTotal, symbol)}
                      </p>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-sm text-[var(--calc-accent)] hover:underline"
                      >
                        Vaciar
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--calc-muted)]">
                      Pulsa + para agregar · × para multiplicar
                    </p>
                  )}
                </div>
                <CartItemsList
                  items={cartItems}
                  currencySymbol={symbol}
                  onRemove={removeCartItem}
                  variant="microsoft"
                />
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--calc-accent)] text-[var(--calc-accent)]"
          : "border-transparent text-[var(--calc-muted)] hover:bg-[#f3f2f1]"
      }`}
    >
      {children}
    </button>
  );
}
