"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppSettings,
  CashierUser,
  Debt,
  PaymentMethod,
  Product,
  Purchase,
  PurchaseItem,
} from "@/lib/types";
import { debtPendingAmount, summarizeDebts } from "@/lib/debts";
import { findProductByName } from "@/lib/products";
import { asUuidOrNull } from "@/lib/id";
import {
  deactivateCashierUser,
  deleteDebt,
  deletePurchase,
  ensureStore,
  insertCashierUser,
  insertDebt,
  insertProduct,
  insertPurchase,
  loadAllStoreData,
  newId,
  replaceProducts,
  replacePurchaseItems,
  saveStoreSettings,
  updateCashierUser as updateCashierUserDb,
  updateDebt,
  updateProduct,
} from "@/lib/supabase/repository";
import {
  getActiveUserId,
  purchaseDateKey,
  purchaseTotal,
  setActiveUserId,
  todayKey,
} from "@/lib/storage";

type AppDataContextValue = {
  ready: boolean;
  loadError: string | null;
  purchases: Purchase[];
  products: Product[];
  settings: AppSettings;
  cashierUsers: CashierUser[];
  activeUser: CashierUser | null;
  todayPurchases: Purchase[];
  todayTotal: number;
  todayKey: string;
  finalizePurchase: (
    items: PurchaseItem[],
    paymentMethod?: PaymentMethod,
  ) => Purchase | null;
  updatePurchase: (id: string, items: PurchaseItem[]) => void;
  removePurchase: (id: string) => void;
  purchasesForDate: (dateKey: string) => Purchase[];
  setProducts: (products: Product[]) => void;
  setSettings: (settings: AppSettings) => void;
  setCashierUsers: (users: CashierUser[]) => void;
  addCashierUser: (name: string, cedula?: string) => CashierUser | null;
  updateCashierUser: (
    id: string,
    patch: Partial<Pick<CashierUser, "name" | "cedula">>,
  ) => void;
  removeCashierUser: (id: string) => void;
  setActiveUser: (user: CashierUser) => void;
  clearActiveUser: () => void;
  upsertProduct: (name: string, price: number) => Product;
  toggleItemDetails: (enabled: boolean) => void;
  debts: Debt[];
  debtSummary: ReturnType<typeof summarizeDebts>;
  addDebt: (debtorName: string, amount: number, note?: string) => Debt | null;
  addDebtPayment: (id: string, amount: number) => void;
  markDebtPaid: (id: string) => void;
  removeDebt: (id: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function resolveActiveUser(
  users: CashierUser[],
  userId: string | null,
): CashierUser | null {
  if (!userId) return null;
  return users.find((u) => u.id === userId) ?? null;
}

function normalizeCedula(cedula?: string) {
  const trimmed = cedula?.trim();
  return trimmed ? trimmed : undefined;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const storeIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [cashierUsers, setCashierUsersState] = useState<CashierUser[]>([]);
  const [activeUser, setActiveUserState] = useState<CashierUser | null>(null);
  const [debts, setDebtsState] = useState<Debt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { storeId, settings: storeSettings } = await ensureStore();
        storeIdRef.current = storeId;
        const data = await loadAllStoreData(storeId);
        const userId = getActiveUserId();

        if (cancelled) return;

        setSettingsState(storeSettings);
        setCashierUsersState(data.cashierUsers);
        setPurchases(data.purchases);
        setProductsState(data.products);
        setDebtsState(data.debts);
        setActiveUserState(resolveActiveUser(data.cashierUsers, userId));
        setLoadError(null);
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "No se pudo conectar con Supabase. Ejecuta supabase/schema.sql y supabase/policies-anon.sql en tu proyecto.",
        );
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettingsState(next);
    const storeId = storeIdRef.current;
    if (!storeId) return;
    try {
      await saveStoreSettings(storeId, next);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const persistProducts = useCallback(async (next: Product[]) => {
    setProductsState(next);
    const storeId = storeIdRef.current;
    if (!storeId) return;
    try {
      await replaceProducts(storeId, next);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const setActiveUser = useCallback((user: CashierUser) => {
    setActiveUserState(user);
    setActiveUserId(user.id);
  }, []);

  const clearActiveUser = useCallback(() => {
    setActiveUserState(null);
    setActiveUserId(null);
  }, []);

  const finalizePurchase = useCallback(
    (items: PurchaseItem[], paymentMethod?: PaymentMethod) => {
      if (items.length === 0 || !storeIdRef.current) return null;
      const user = activeUser;
      if (!user) return null;

      const purchase: Purchase = {
        id: newId(),
        items: items.map((item) => ({
          ...item,
          id: newId(),
          productId: asUuidOrNull(item.productId) ?? undefined,
        })),
        total: purchaseTotal(items),
        createdAt: new Date().toISOString(),
        registeredBy: user.name,
        registeredById: user.id,
        ...(paymentMethod ? { paymentMethod } : {}),
      };

      setPurchases((prev) => [purchase, ...prev]);
      void insertPurchase(storeIdRef.current, purchase).catch(console.error);
      return purchase;
    },
    [activeUser],
  );

  const updatePurchase = useCallback((id: string, items: PurchaseItem[]) => {
    if (items.length === 0) return;
    const total = purchaseTotal(items);
    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, items, total } : p)),
    );
    void replacePurchaseItems(id, items).catch(console.error);
  }, []);

  const removePurchase = useCallback((id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    void deletePurchase(id).catch(console.error);
  }, []);

  const purchasesForDate = useCallback(
    (dateKey: string) =>
      purchases
        .filter((p) => purchaseDateKey(p.createdAt) === dateKey)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [purchases],
  );

  const upsertProduct = useCallback(
    (name: string, price: number): Product => {
      const trimmed = name.trim();
      const existing = findProductByName(products, trimmed);

      if (existing) {
        if (Math.abs(existing.price - price) > 0.001) {
          const updated = { ...existing, price };
          setProductsState((prev) =>
            prev.map((p) => (p.id === existing.id ? updated : p)),
          );
          void updateProduct(updated).catch(console.error);
          return updated;
        }
        return existing;
      }

      const product: Product = {
        id: newId(),
        name: trimmed,
        price,
      };
      setProductsState((prev) => [product, ...prev]);
      const storeId = storeIdRef.current;
      if (storeId) void insertProduct(storeId, product).catch(console.error);
      return product;
    },
    [products],
  );

  const toggleItemDetails = useCallback(
    (enabled: boolean) => {
      if (!settings) return;
      void persistSettings({
        ...settings,
        features: { ...settings.features, itemDetails: enabled },
      });
    },
    [settings, persistSettings],
  );

  const addDebt = useCallback(
    (debtorName: string, amount: number, note?: string): Debt | null => {
      const trimmed = debtorName.trim();
      if (!trimmed || amount <= 0 || !storeIdRef.current) return null;

      const debt: Debt = {
        id: newId(),
        debtorName: trimmed,
        amount,
        amountPaid: 0,
        status: "pending",
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
        registeredBy: activeUser?.name,
        registeredById: activeUser?.id,
      };

      setDebtsState((prev) => [debt, ...prev]);
      void insertDebt(storeIdRef.current, debt).catch(console.error);
      return debt;
    },
    [activeUser],
  );

  const markDebtPaid = useCallback((id: string) => {
    setDebtsState((prev) => {
      const debt = prev.find((d) => d.id === id);
      if (!debt) return prev;
      const pending = debtPendingAmount(debt);
      if (pending <= 0) return prev;

      const paidAt = new Date().toISOString();
      const next = prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "paid" as const,
              amountPaid: d.amount,
              paidAt,
            }
          : d,
      );
      const updated = next.find((d) => d.id === id);
      if (updated) void updateDebt(updated).catch(console.error);
      return next;
    });
  }, []);

  const addDebtPayment = useCallback((id: string, amount: number) => {
    if (amount <= 0) return;

    setDebtsState((prev) => {
      const debt = prev.find((d) => d.id === id);
      if (!debt) return prev;

      const pending = debtPendingAmount(debt);
      const pay = Math.min(pending, Math.round(amount * 100) / 100);
      if (pay <= 0) return prev;

      const newPaid = Math.round((debt.amountPaid + pay) * 100) / 100;
      const fullyPaid = newPaid >= debt.amount - 0.001;
      const paidAt = fullyPaid ? new Date().toISOString() : debt.paidAt;

      const next = prev.map((d) =>
        d.id === id
          ? {
              ...d,
              amountPaid: fullyPaid ? d.amount : newPaid,
              status: fullyPaid ? ("paid" as const) : ("pending" as const),
              paidAt: fullyPaid ? paidAt : d.paidAt,
            }
          : d,
      );
      const updated = next.find((d) => d.id === id);
      if (updated) void updateDebt(updated).catch(console.error);
      return next;
    });
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebtsState((prev) => prev.filter((d) => d.id !== id));
    void deleteDebt(id).catch(console.error);
  }, []);

  const addCashierUser = useCallback(
    (name: string, cedula?: string): CashierUser | null => {
      const trimmed = name.trim();
      if (!trimmed || !storeIdRef.current) return null;
      const code = normalizeCedula(cedula);
      if (
        code &&
        cashierUsers.some((u) => u.cedula?.toLowerCase() === code.toLowerCase())
      ) {
        return null;
      }

      const user: CashierUser = {
        id: newId(),
        name: trimmed,
        ...(code ? { cedula: code } : {}),
      };

      setCashierUsersState((prev) => [...prev, user]);
      void insertCashierUser(storeIdRef.current, user).catch(console.error);
      return user;
    },
    [cashierUsers],
  );

  const updateCashierUser = useCallback(
    (
      id: string,
      patch: Partial<Pick<CashierUser, "name" | "cedula">>,
    ) => {
      const code =
        patch.cedula !== undefined ? normalizeCedula(patch.cedula) : undefined;
      if (
        code &&
        cashierUsers.some(
          (u) => u.id !== id && u.cedula?.toLowerCase() === code.toLowerCase(),
        )
      ) {
        return;
      }

      let updatedUser: CashierUser | undefined;
      setCashierUsersState((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          updatedUser = {
            ...u,
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.cedula !== undefined
              ? code
                ? { cedula: code }
                : { cedula: undefined }
              : {}),
          };
          return updatedUser;
        }),
      );

      if (updatedUser) {
        void updateCashierUserDb(updatedUser).catch(console.error);
        if (activeUser?.id === id) setActiveUserState(updatedUser);
      }
    },
    [cashierUsers, activeUser?.id],
  );

  const removeCashierUser = useCallback(
    (id: string) => {
      if (cashierUsers.length <= 1) return;
      setCashierUsersState((prev) => prev.filter((u) => u.id !== id));
      void deactivateCashierUser(id).catch(console.error);
      if (activeUser?.id === id) clearActiveUser();
    },
    [cashierUsers.length, activeUser?.id, clearActiveUser],
  );

  const persistCashierUsers = useCallback((next: CashierUser[]) => {
    setCashierUsersState(next);
  }, []);

  const todayDateKey = todayKey();
  const todayPurchases = purchasesForDate(todayDateKey);
  const todayTotal = todayPurchases.reduce((sum, p) => sum + p.total, 0);
  const debtSummary = useMemo(() => summarizeDebts(debts), [debts]);

  const value = useMemo(
    () => ({
      ready,
      loadError,
      purchases,
      products,
      settings: settings!,
      cashierUsers,
      activeUser,
      todayPurchases,
      todayTotal,
      todayKey: todayDateKey,
      finalizePurchase,
      updatePurchase,
      removePurchase,
      purchasesForDate,
      setProducts: persistProducts,
      setSettings: persistSettings,
      setCashierUsers: persistCashierUsers,
      addCashierUser,
      updateCashierUser,
      removeCashierUser,
      setActiveUser,
      clearActiveUser,
      upsertProduct,
      toggleItemDetails,
      debts,
      debtSummary,
      addDebt,
      addDebtPayment,
      markDebtPaid,
      removeDebt,
    }),
    [
      ready,
      loadError,
      purchases,
      products,
      settings,
      cashierUsers,
      activeUser,
      todayPurchases,
      todayTotal,
      todayDateKey,
      finalizePurchase,
      updatePurchase,
      removePurchase,
      purchasesForDate,
      persistProducts,
      persistSettings,
      persistCashierUsers,
      addCashierUser,
      updateCashierUser,
      removeCashierUser,
      setActiveUser,
      clearActiveUser,
      upsertProduct,
      toggleItemDetails,
      debts,
      debtSummary,
      addDebt,
      addDebtPayment,
      markDebtPaid,
      removeDebt,
    ],
  );

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center text-stone-500">
        Conectando con Supabase…
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-medium text-red-700">Error de conexión</p>
        <p className="max-w-md text-sm text-stone-600">{loadError}</p>
        <p className="max-w-md text-xs text-stone-500">
          En Supabase → SQL Editor ejecuta{" "}
          <code className="rounded bg-stone-100 px-1">supabase/schema.sql</code>{" "}
          y luego{" "}
          <code className="rounded bg-stone-100 px-1">
            supabase/policies-anon.sql
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData debe usarse dentro de AppDataProvider");
  }
  return ctx;
}
