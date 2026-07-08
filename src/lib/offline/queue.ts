import type {
  AppSettings,
  CashierUser,
  Debt,
  Product,
  Purchase,
  PurchaseItem,
} from "@/lib/types";
import {
  deactivateCashierUser,
  deleteDebt,
  deletePurchase,
  insertCashierUser,
  insertDebt,
  insertProduct,
  insertPurchase,
  replaceProducts,
  replacePurchaseItems,
  saveStoreSettings,
  updateCashierUser,
  updateDebt,
  updateProduct,
} from "@/lib/supabase/repository";

const QUEUE_KEY = "ventas-calc:sync-queue";

export type SyncOp =
  | { type: "saveStoreSettings"; storeId: string; settings: AppSettings }
  | { type: "insertPurchase"; storeId: string; purchase: Purchase }
  | { type: "replacePurchaseItems"; purchaseId: string; items: PurchaseItem[] }
  | { type: "deletePurchase"; purchaseId: string }
  | { type: "insertProduct"; storeId: string; product: Product }
  | { type: "updateProduct"; product: Product }
  | { type: "replaceProducts"; storeId: string; products: Product[] }
  | { type: "insertDebt"; storeId: string; debt: Debt }
  | { type: "updateDebt"; debt: Debt }
  | { type: "deleteDebt"; debtId: string }
  | { type: "insertCashierUser"; storeId: string; user: CashierUser }
  | { type: "updateCashierUser"; user: CashierUser }
  | { type: "deactivateCashierUser"; userId: string };

function readQueue(): SyncOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncOp[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncOp[]): void {
  if (typeof window === "undefined") return;
  if (queue.length === 0) localStorage.removeItem(QUEUE_KEY);
  else localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getPendingSyncCount(): number {
  return readQueue().length;
}

export function enqueueSyncOp(op: SyncOp): void {
  writeQueue([...readQueue(), op]);
}

function withStoreId(op: SyncOp, storeId: string): SyncOp {
  switch (op.type) {
    case "saveStoreSettings":
    case "insertPurchase":
    case "insertProduct":
    case "replaceProducts":
    case "insertDebt":
    case "insertCashierUser":
      return { ...op, storeId };
    default:
      return op;
  }
}

function isIgnorableSyncError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("duplicate") ||
    msg.includes("23505") ||
    msg.includes("already exists")
  );
}

async function executeSyncOp(op: SyncOp): Promise<void> {
  switch (op.type) {
    case "saveStoreSettings":
      await saveStoreSettings(op.storeId, op.settings);
      break;
    case "insertPurchase":
      await insertPurchase(op.storeId, op.purchase);
      break;
    case "replacePurchaseItems":
      await replacePurchaseItems(op.purchaseId, op.items);
      break;
    case "deletePurchase":
      await deletePurchase(op.purchaseId);
      break;
    case "insertProduct":
      await insertProduct(op.storeId, op.product);
      break;
    case "updateProduct":
      await updateProduct(op.product);
      break;
    case "replaceProducts":
      await replaceProducts(op.storeId, op.products);
      break;
    case "insertDebt":
      await insertDebt(op.storeId, op.debt);
      break;
    case "updateDebt":
      await updateDebt(op.debt);
      break;
    case "deleteDebt":
      await deleteDebt(op.debtId);
      break;
    case "insertCashierUser":
      await insertCashierUser(op.storeId, op.user);
      break;
    case "updateCashierUser":
      await updateCashierUser(op.user);
      break;
    case "deactivateCashierUser":
      await deactivateCashierUser(op.userId);
      break;
  }
}

export async function flushSyncQueue(storeId: string): Promise<{
  synced: number;
  remaining: number;
}> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining: SyncOp[] = [];
  let synced = 0;

  for (let i = 0; i < queue.length; i++) {
    const op = queue[i];
    try {
      await executeSyncOp(withStoreId(op, storeId));
      synced += 1;
    } catch (err) {
      if (isIgnorableSyncError(err)) {
        synced += 1;
        continue;
      }
      remaining.push(...queue.slice(i));
      break;
    }
  }

  writeQueue(remaining);
  return { synced, remaining: remaining.length };
}
