import type {
  AppSettings,
  CashierUser,
  Debt,
  DebtStatus,
  PaymentMethod,
  Product,
  Purchase,
  PurchaseItem,
} from "@/lib/types";
import { DEFAULT_CASHIER_USERS, DEFAULT_SETTINGS } from "@/lib/types";
import { LOCAL_STORE_ID_KEY } from "./config";
import { supabase } from "./client";

import { asUuidOrNull, generateId as newId, isValidUuid } from "@/lib/id";

type DbStore = {
  id: string;
  name: string;
  currency_symbol: string;
  features: AppSettings["features"];
};

type DbCashierUser = {
  id: string;
  name: string;
  cedula: string | null;
};

type DbPurchase = {
  id: string;
  cashier_user_id: string | null;
  registered_by_name: string | null;
  total: number;
  payment_method: PaymentMethod | null;
  created_at: string;
};

type DbPurchaseItem = {
  id: string;
  purchase_id: string;
  product_id: string | null;
  amount: number;
  note: string | null;
  sort_order: number;
};

type DbProduct = {
  id: string;
  name: string;
  price: number;
  barcode: string | null;
};

type DbDebt = {
  id: string;
  debtor_name: string;
  amount: number;
  amount_paid: number;
  status: DebtStatus;
  note: string | null;
  cashier_user_id: string | null;
  registered_by_name: string | null;
  created_at: string;
  paid_at: string | null;
};

function mapSettings(row: DbStore): AppSettings {
  return {
    storeName: row.name,
    currencySymbol: row.currency_symbol,
    features: {
      ...DEFAULT_SETTINGS.features,
      ...(row.features ?? {}),
    },
  };
}

function mapCashierUser(row: DbCashierUser): CashierUser {
  return {
    id: row.id,
    name: row.name,
    ...(row.cedula ? { cedula: row.cedula } : {}),
  };
}

function mapPurchase(row: DbPurchase, items: DbPurchaseItem[]): Purchase {
  return {
    id: row.id,
    total: Number(row.total),
    createdAt: row.created_at,
    registeredBy: row.registered_by_name ?? undefined,
    registeredById: row.cashier_user_id ?? undefined,
    ...(row.payment_method ? { paymentMethod: row.payment_method } : {}),
    items: items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        note: item.note ?? undefined,
        productId: item.product_id ?? undefined,
      })),
  };
}

function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    ...(row.barcode ? { barcode: row.barcode } : {}),
  };
}

function mapDebt(row: DbDebt): Debt {
  return {
    id: row.id,
    debtorName: row.debtor_name,
    amount: Number(row.amount),
    amountPaid: Number(row.amount_paid),
    status: row.status,
    note: row.note ?? undefined,
    registeredBy: row.registered_by_name ?? undefined,
    registeredById: row.cashier_user_id ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
  };
}

function readLocalStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORE_ID_KEY);
}

function writeLocalStoreId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORE_ID_KEY, id);
}

async function fetchStoreById(id: string): Promise<DbStore | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, currency_symbol, features")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DbStore | null;
}

async function seedDefaultUsers(storeId: string): Promise<CashierUser[]> {
  const rows = DEFAULT_CASHIER_USERS.map((u) => ({
    id: newId(),
    store_id: storeId,
    name: u.name,
    active: true,
  }));

  const { data, error } = await supabase
    .from("cashier_users")
    .insert(rows)
    .select("id, name, cedula");

  if (error) throw new Error(error.message);
  return (data as DbCashierUser[]).map(mapCashierUser);
}

export async function ensureStore(): Promise<{
  storeId: string;
  settings: AppSettings;
}> {
  const cachedId = readLocalStoreId();
  if (cachedId) {
    const cached = await fetchStoreById(cachedId);
    if (cached) {
      return { storeId: cached.id, settings: mapSettings(cached) };
    }
  }

  const { data: existing, error: listError } = await supabase
    .from("stores")
    .select("id, name, currency_symbol, features")
    .order("created_at", { ascending: true })
    .limit(1);

  if (listError) throw new Error(listError.message);

  if (existing && existing.length > 0) {
    const store = existing[0] as DbStore;
    writeLocalStoreId(store.id);
    return { storeId: store.id, settings: mapSettings(store) };
  }

  const { data: created, error: createError } = await supabase
    .from("stores")
    .insert({
      name: DEFAULT_SETTINGS.storeName,
      currency_symbol: DEFAULT_SETTINGS.currencySymbol,
      features: DEFAULT_SETTINGS.features,
    })
    .select("id, name, currency_symbol, features")
    .single();

  if (createError) throw new Error(createError.message);

  const store = created as DbStore;
  writeLocalStoreId(store.id);
  await seedDefaultUsers(store.id);

  return { storeId: store.id, settings: mapSettings(store) };
}

export async function loadCashierUsers(storeId: string): Promise<CashierUser[]> {
  const { data, error } = await supabase
    .from("cashier_users")
    .select("id, name, cedula")
    .eq("store_id", storeId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const users = (data as DbCashierUser[]).map(mapCashierUser);
  if (users.length === 0) {
    return seedDefaultUsers(storeId);
  }
  return users;
}

export async function loadProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, barcode")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbProduct[]).map(mapProduct);
}

export async function loadDebts(storeId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select(
      "id, debtor_name, amount, amount_paid, status, note, cashier_user_id, registered_by_name, created_at, paid_at",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbDebt[]).map(mapDebt);
}

export async function loadPurchases(storeId: string): Promise<Purchase[]> {
  const { data: purchaseRows, error: purchaseError } = await supabase
    .from("purchases")
    .select(
      "id, cashier_user_id, registered_by_name, total, payment_method, created_at",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (purchaseError) throw new Error(purchaseError.message);
  if (!purchaseRows?.length) return [];

  const purchaseIds = purchaseRows.map((p) => p.id);
  const { data: itemRows, error: itemError } = await supabase
    .from("purchase_items")
    .select("id, purchase_id, product_id, amount, note, sort_order")
    .in("purchase_id", purchaseIds);

  if (itemError) throw new Error(itemError.message);

  const itemsByPurchase = new Map<string, DbPurchaseItem[]>();
  for (const item of (itemRows ?? []) as DbPurchaseItem[]) {
    const list = itemsByPurchase.get(item.purchase_id) ?? [];
    list.push(item);
    itemsByPurchase.set(item.purchase_id, list);
  }

  return (purchaseRows as DbPurchase[]).map((row) =>
    mapPurchase(row, itemsByPurchase.get(row.id) ?? []),
  );
}

export async function saveStoreSettings(
  storeId: string,
  settings: AppSettings,
): Promise<void> {
  const { error } = await supabase
    .from("stores")
    .update({
      name: settings.storeName,
      currency_symbol: settings.currencySymbol,
      features: settings.features,
    })
    .eq("id", storeId);

  if (error) throw new Error(error.message);
}

export async function insertPurchase(
  storeId: string,
  purchase: Purchase,
): Promise<void> {
  if (!isValidUuid(purchase.id)) {
    throw new Error("ID de compra inválido");
  }

  const { error: purchaseError } = await supabase.from("purchases").insert({
    id: purchase.id,
    store_id: storeId,
    cashier_user_id: asUuidOrNull(purchase.registeredById),
    registered_by_name: purchase.registeredBy ?? null,
    total: purchase.total,
    payment_method: purchase.paymentMethod ?? null,
    created_at: purchase.createdAt,
  });

  if (purchaseError) throw new Error(purchaseError.message);

  if (purchase.items.length > 0) {
    const { error: itemsError } = await supabase.from("purchase_items").insert(
      purchase.items.map((item, index) => ({
        id: isValidUuid(item.id) ? item.id : newId(),
        purchase_id: purchase.id,
        product_id: asUuidOrNull(item.productId),
        amount: item.amount,
        note: item.note ?? null,
        sort_order: index,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }
}

export async function replacePurchaseItems(
  purchaseId: string,
  items: PurchaseItem[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("purchase_items")
    .delete()
    .eq("purchase_id", purchaseId);

  if (deleteError) throw new Error(deleteError.message);

  if (items.length === 0) return;

  const { error: insertError } = await supabase.from("purchase_items").insert(
    items.map((item, index) => ({
      id: isValidUuid(item.id) ? item.id : newId(),
      purchase_id: purchaseId,
      product_id: asUuidOrNull(item.productId),
      amount: item.amount,
      note: item.note ?? null,
      sort_order: index,
    })),
  );

  if (insertError) throw new Error(insertError.message);

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const { error: updateError } = await supabase
    .from("purchases")
    .update({ total })
    .eq("id", purchaseId);

  if (updateError) throw new Error(updateError.message);
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId);

  if (error) throw new Error(error.message);
}

export async function insertProduct(
  storeId: string,
  product: Product,
): Promise<void> {
  const { error } = await supabase.from("products").insert({
    id: product.id,
    store_id: storeId,
    name: product.name,
    price: product.price,
    barcode: product.barcode ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function updateProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      barcode: product.barcode ?? null,
    })
    .eq("id", product.id);

  if (error) throw new Error(error.message);
}

export async function replaceProducts(
  storeId: string,
  products: Product[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("store_id", storeId);

  if (deleteError) throw new Error(deleteError.message);
  if (products.length === 0) return;

  const { error: insertError } = await supabase.from("products").insert(
    products.map((p) => ({
      id: p.id,
      store_id: storeId,
      name: p.name,
      price: p.price,
      barcode: p.barcode ?? null,
    })),
  );

  if (insertError) throw new Error(insertError.message);
}

export async function insertDebt(storeId: string, debt: Debt): Promise<void> {
  const { error } = await supabase.from("debts").insert({
    id: debt.id,
    store_id: storeId,
    debtor_name: debt.debtorName,
    amount: debt.amount,
    amount_paid: debt.amountPaid,
    status: debt.status,
    note: debt.note ?? null,
    cashier_user_id: debt.registeredById ?? null,
    registered_by_name: debt.registeredBy ?? null,
    created_at: debt.createdAt,
    paid_at: debt.paidAt ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function updateDebt(debt: Debt): Promise<void> {
  const { error } = await supabase
    .from("debts")
    .update({
      debtor_name: debt.debtorName,
      amount: debt.amount,
      amount_paid: debt.amountPaid,
      status: debt.status,
      note: debt.note ?? null,
      paid_at: debt.paidAt ?? null,
    })
    .eq("id", debt.id);

  if (error) throw new Error(error.message);
}

export async function deleteDebt(debtId: string): Promise<void> {
  const { error } = await supabase.from("debts").delete().eq("id", debtId);
  if (error) throw new Error(error.message);
}

export async function insertCashierUser(
  storeId: string,
  user: CashierUser,
): Promise<void> {
  const { error } = await supabase.from("cashier_users").insert({
    id: user.id,
    store_id: storeId,
    name: user.name,
    cedula: user.cedula ?? null,
    active: true,
  });

  if (error) throw new Error(error.message);
}

export async function updateCashierUser(user: CashierUser): Promise<void> {
  const { error } = await supabase
    .from("cashier_users")
    .update({
      name: user.name,
      cedula: user.cedula ?? null,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}

export async function deactivateCashierUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from("cashier_users")
    .update({ active: false })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function loadAllStoreData(storeId: string): Promise<{
  cashierUsers: CashierUser[];
  products: Product[];
  purchases: Purchase[];
  debts: Debt[];
}> {
  const [cashierUsers, products, purchases, debts] = await Promise.all([
    loadCashierUsers(storeId),
    loadProducts(storeId),
    loadPurchases(storeId),
    loadDebts(storeId),
  ]);

  return { cashierUsers, products, purchases, debts };
}

export { newId };
