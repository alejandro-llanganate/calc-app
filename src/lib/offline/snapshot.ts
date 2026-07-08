import type {
  AppSettings,
  CashierUser,
  Debt,
  Product,
  Purchase,
} from "@/lib/types";
import {
  getCashierUsers,
  getDebts,
  getProducts,
  getPurchases,
  getSettings,
  saveCashierUsers,
  saveDebts,
  saveProducts,
  savePurchases,
  saveSettings,
} from "@/lib/storage";
import { LOCAL_STORE_ID_KEY } from "@/lib/supabase/config";

export type OfflineSnapshot = {
  storeId: string | null;
  settings: AppSettings;
  cashierUsers: CashierUser[];
  purchases: Purchase[];
  products: Product[];
  debts: Debt[];
};

function readLocalStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORE_ID_KEY);
}

function writeLocalStoreId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORE_ID_KEY, id);
}

export function loadOfflineSnapshot(): OfflineSnapshot {
  return {
    storeId: readLocalStoreId(),
    settings: getSettings(),
    cashierUsers: getCashierUsers(),
    purchases: getPurchases(),
    products: getProducts(),
    debts: getDebts(),
  };
}

export function saveOfflineSnapshot(snapshot: OfflineSnapshot): void {
  saveSettings(snapshot.settings);
  saveCashierUsers(snapshot.cashierUsers);
  savePurchases(snapshot.purchases);
  saveProducts(snapshot.products);
  saveDebts(snapshot.debts);
  if (snapshot.storeId) writeLocalStoreId(snapshot.storeId);
}
