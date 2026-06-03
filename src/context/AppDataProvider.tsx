"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppSettings, Product, Purchase, PurchaseItem } from "@/lib/types";
import { findProductByName } from "@/lib/products";
import {
  generateId,
  getProducts,
  getPurchases,
  getSettings,
  purchaseDateKey,
  purchaseTotal,
  saveProducts,
  savePurchases,
  saveSettings,
  todayKey,
} from "@/lib/storage";

type AppDataContextValue = {
  ready: boolean;
  purchases: Purchase[];
  products: Product[];
  settings: AppSettings;
  todayPurchases: Purchase[];
  todayTotal: number;
  todayKey: string;
  finalizePurchase: (items: PurchaseItem[]) => Purchase | null;
  removePurchase: (id: string) => void;
  purchasesForDate: (dateKey: string) => Purchase[];
  setProducts: (products: Product[]) => void;
  setSettings: (settings: AppSettings) => void;
  upsertProduct: (name: string, price: number) => Product;
  toggleItemDetails: (enabled: boolean) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPurchases(getPurchases());
    setProductsState(getProducts());
    setSettingsState(getSettings());
    setReady(true);
  }, []);

  const persistPurchases = useCallback((next: Purchase[]) => {
    setPurchases(next);
    savePurchases(next);
  }, []);

  const persistProducts = useCallback((next: Product[]) => {
    setProductsState(next);
    saveProducts(next);
  }, []);

  const persistSettings = useCallback((next: AppSettings) => {
    setSettingsState(next);
    saveSettings(next);
  }, []);

  const finalizePurchase = useCallback(
    (items: PurchaseItem[]) => {
      if (items.length === 0) return null;
      const purchase: Purchase = {
        id: generateId(),
        items,
        total: purchaseTotal(items),
        createdAt: new Date().toISOString(),
      };
      const next = [purchase, ...getPurchases()];
      persistPurchases(next);
      return purchase;
    },
    [persistPurchases],
  );

  const removePurchase = useCallback(
    (id: string) => {
      persistPurchases(getPurchases().filter((p) => p.id !== id));
    },
    [persistPurchases],
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
      const current = getProducts();
      const existing = findProductByName(current, trimmed);

      if (existing) {
        if (Math.abs(existing.price - price) > 0.001) {
          const updated = current.map((p) =>
            p.id === existing.id ? { ...p, price } : p,
          );
          persistProducts(updated);
          return { ...existing, price };
        }
        return existing;
      }

      const product: Product = {
        id: generateId(),
        name: trimmed,
        price,
      };
      persistProducts([product, ...current]);
      return product;
    },
    [persistProducts],
  );

  const toggleItemDetails = useCallback(
    (enabled: boolean) => {
      const current = getSettings();
      persistSettings({
        ...current,
        features: { ...current.features, itemDetails: enabled },
      });
    },
    [persistSettings],
  );

  const todayDateKey = todayKey();
  const todayPurchases = purchasesForDate(todayDateKey);
  const todayTotal = todayPurchases.reduce((sum, p) => sum + p.total, 0);

  const value = useMemo(
    () => ({
      ready,
      purchases,
      products,
      settings: settings!,
      todayPurchases,
      todayTotal,
      todayKey: todayDateKey,
      finalizePurchase,
      removePurchase,
      purchasesForDate,
      setProducts: persistProducts,
      setSettings: persistSettings,
      upsertProduct,
      toggleItemDetails,
    }),
    [
      ready,
      purchases,
      products,
      settings,
      todayPurchases,
      todayTotal,
      todayDateKey,
      finalizePurchase,
      removePurchase,
      purchasesForDate,
      persistProducts,
      persistSettings,
      upsertProduct,
      toggleItemDetails,
    ],
  );

  if (!ready || !settings) {
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
