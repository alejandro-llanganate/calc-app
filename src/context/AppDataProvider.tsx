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
import { DEFAULT_SETTINGS } from "@/lib/types";
import { debtPendingAmount, summarizeDebts } from "@/lib/debts";
import { findProductByName } from "@/lib/products";
import { asUuidOrNull } from "@/lib/id";
import { probeSupabase } from "@/lib/offline/connectivity";
import {
  enqueueSyncOp,
  flushSyncQueue,
  getPendingSyncCount,
  type SyncOp,
} from "@/lib/offline/queue";
import {
  loadOfflineSnapshot,
  saveOfflineSnapshot,
} from "@/lib/offline/snapshot";
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
  isOnline: boolean;
  pendingSync: number;
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
  const syncInProgressRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [cashierUsers, setCashierUsersState] = useState<CashierUser[]>([]);
  const [activeUser, setActiveUserState] = useState<CashierUser | null>(null);
  const [debts, setDebtsState] = useState<Debt[]>([]);
  const [ready, setReady] = useState(false);

  const ensureStoreId = useCallback((): string => {
    if (!storeIdRef.current) {
      const snapshot = loadOfflineSnapshot();
      storeIdRef.current = snapshot.storeId ?? newId();
      saveOfflineSnapshot({ ...snapshot, storeId: storeIdRef.current });
    }
    return storeIdRef.current;
  }, []);

  const applySnapshot = useCallback(
    (
      snapshot: ReturnType<typeof loadOfflineSnapshot>,
      userId: string | null,
    ) => {
      storeIdRef.current = snapshot.storeId;
      setSettingsState(snapshot.settings);
      setCashierUsersState(snapshot.cashierUsers);
      setPurchases(snapshot.purchases);
      setProductsState(snapshot.products);
      setDebtsState(snapshot.debts);
      setActiveUserState(resolveActiveUser(snapshot.cashierUsers, userId));
    },
    [],
  );

  const queueSync = useCallback((op: SyncOp) => {
    enqueueSyncOp(op);
    setPendingSync(getPendingSyncCount());
    setIsOnline(false);
  }, []);

  const pushSync = useCallback(
    async (op: SyncOp, action: () => Promise<void>) => {
      try {
        await action();
        setIsOnline(true);
      } catch (err) {
        console.error(err);
        queueSync(op);
      }
    },
    [queueSync],
  );

  const syncToSupabase = useCallback(async () => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    try {
      const reachable = await probeSupabase();
      if (!reachable) {
        setIsOnline(false);
        return;
      }

      const { storeId, settings: remoteSettings } = await ensureStore();
      storeIdRef.current = storeId;

      const { remaining } = await flushSyncQueue(storeId);
      setPendingSync(remaining);
      setIsOnline(remaining === 0);
      if (remaining === 0) setLoadError(null);

      setSettingsState((prev) => prev ?? remoteSettings);
      saveOfflineSnapshot({
        storeId,
        settings: remoteSettings,
        cashierUsers,
        purchases,
        products,
        debts,
      });
    } catch (err) {
      console.error(err);
      setIsOnline(false);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [cashierUsers, purchases, products, debts]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const userId = getActiveUserId();

      try {
        const { storeId, settings: remoteSettings } = await ensureStore();
        const data = await loadAllStoreData(storeId);
        if (cancelled) return;

        const snapshot = {
          storeId,
          settings: remoteSettings,
          cashierUsers: data.cashierUsers,
          purchases: data.purchases,
          products: data.products,
          debts: data.debts,
        };

        saveOfflineSnapshot(snapshot);
        applySnapshot(snapshot, userId);
        setLoadError(null);
        setIsOnline(true);
        setPendingSync(getPendingSyncCount());

        const { remaining } = await flushSyncQueue(storeId);
        if (!cancelled) {
          setPendingSync(remaining);
          setIsOnline(remaining === 0);
        }
      } catch (err) {
        if (cancelled) return;

        const snapshot = loadOfflineSnapshot();
        if (!snapshot.storeId) {
          snapshot.storeId = newId();
          saveOfflineSnapshot(snapshot);
        }

        applySnapshot(snapshot, userId);
        setPendingSync(getPendingSyncCount());
        setIsOnline(false);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Sin conexión. Los datos se guardan en este dispositivo.",
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (!ready || !settings) return;
    saveOfflineSnapshot({
      storeId: storeIdRef.current,
      settings,
      cashierUsers,
      purchases,
      products,
      debts,
    });
  }, [ready, settings, cashierUsers, purchases, products, debts]);

  useEffect(() => {
    const onOnline = () => {
      void syncToSupabase();
    };

    window.addEventListener("online", onOnline);
    const interval = window.setInterval(() => {
      if (getPendingSyncCount() > 0) void syncToSupabase();
    }, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
    };
  }, [syncToSupabase]);

  const persistSettings = useCallback(
    async (next: AppSettings) => {
      setSettingsState(next);
      const storeId = ensureStoreId();
      void pushSync(
        { type: "saveStoreSettings", storeId, settings: next },
        () => saveStoreSettings(storeId, next),
      );
    },
    [ensureStoreId, pushSync],
  );

  const persistProducts = useCallback(
    async (next: Product[]) => {
      setProductsState(next);
      const storeId = ensureStoreId();
      void pushSync(
        { type: "replaceProducts", storeId, products: next },
        () => replaceProducts(storeId, next),
      );
    },
    [ensureStoreId, pushSync],
  );

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
      if (items.length === 0) return null;
      const user = activeUser;
      if (!user) return null;

      const storeId = ensureStoreId();
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
      void pushSync(
        { type: "insertPurchase", storeId, purchase },
        () => insertPurchase(storeId, purchase),
      );
      return purchase;
    },
    [activeUser, ensureStoreId, pushSync],
  );

  const updatePurchase = useCallback(
    (id: string, items: PurchaseItem[]) => {
      if (items.length === 0) return;
      const total = purchaseTotal(items);
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, items, total } : p)),
      );
      void pushSync(
        { type: "replacePurchaseItems", purchaseId: id, items },
        () => replacePurchaseItems(id, items),
      );
    },
    [pushSync],
  );

  const removePurchase = useCallback(
    (id: string) => {
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      void pushSync(
        { type: "deletePurchase", purchaseId: id },
        () => deletePurchase(id),
      );
    },
    [pushSync],
  );

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
          void pushSync(
            { type: "updateProduct", product: updated },
            () => updateProduct(updated),
          );
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
      const storeId = ensureStoreId();
      void pushSync(
        { type: "insertProduct", storeId, product },
        () => insertProduct(storeId, product),
      );
      return product;
    },
    [products, ensureStoreId, pushSync],
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
      if (!trimmed || amount <= 0) return null;

      const storeId = ensureStoreId();
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
      void pushSync(
        { type: "insertDebt", storeId, debt },
        () => insertDebt(storeId, debt),
      );
      return debt;
    },
    [activeUser, ensureStoreId, pushSync],
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
      if (updated) {
        void pushSync(
          { type: "updateDebt", debt: updated },
          () => updateDebt(updated),
        );
      }
      return next;
    });
  }, [pushSync]);

  const addDebtPayment = useCallback(
    (id: string, amount: number) => {
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
        if (updated) {
          void pushSync(
            { type: "updateDebt", debt: updated },
            () => updateDebt(updated),
          );
        }
        return next;
      });
    },
    [pushSync],
  );

  const removeDebt = useCallback(
    (id: string) => {
      setDebtsState((prev) => prev.filter((d) => d.id !== id));
      void pushSync(
        { type: "deleteDebt", debtId: id },
        () => deleteDebt(id),
      );
    },
    [pushSync],
  );

  const addCashierUser = useCallback(
    (name: string, cedula?: string): CashierUser | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const code = normalizeCedula(cedula);
      if (
        code &&
        cashierUsers.some((u) => u.cedula?.toLowerCase() === code.toLowerCase())
      ) {
        return null;
      }

      const storeId = ensureStoreId();
      const user: CashierUser = {
        id: newId(),
        name: trimmed,
        ...(code ? { cedula: code } : {}),
      };

      setCashierUsersState((prev) => [...prev, user]);
      void pushSync(
        { type: "insertCashierUser", storeId, user },
        () => insertCashierUser(storeId, user),
      );
      return user;
    },
    [cashierUsers, ensureStoreId, pushSync],
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
        const user = updatedUser;
        void pushSync(
          { type: "updateCashierUser", user },
          () => updateCashierUserDb(user),
        );
        if (activeUser?.id === id) setActiveUserState(user);
      }
    },
    [cashierUsers, activeUser?.id, pushSync],
  );

  const removeCashierUser = useCallback(
    (id: string) => {
      if (cashierUsers.length <= 1) return;
      setCashierUsersState((prev) => prev.filter((u) => u.id !== id));
      void pushSync(
        { type: "deactivateCashierUser", userId: id },
        () => deactivateCashierUser(id),
      );
      if (activeUser?.id === id) clearActiveUser();
    },
    [cashierUsers.length, activeUser?.id, clearActiveUser, pushSync],
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
      isOnline,
      pendingSync,
      purchases,
      products,
      settings: settings ?? DEFAULT_SETTINGS,
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
      isOnline,
      pendingSync,
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
        Cargando…
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
