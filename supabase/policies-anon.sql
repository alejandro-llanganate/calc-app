-- =============================================================================
-- Políticas RLS para app sin login (clave anon en el cliente)
-- Ejecutar DESPUÉS de schema.sql en Supabase → SQL Editor
-- =============================================================================

-- Quitar políticas basadas en auth.uid() (no hay login en la app aún)
drop policy if exists "stores_select_own" on public.stores;
drop policy if exists "stores_insert_own" on public.stores;
drop policy if exists "stores_update_own" on public.stores;
drop policy if exists "cashier_users_all_own_store" on public.cashier_users;
drop policy if exists "products_all_own_store" on public.products;
drop policy if exists "purchases_all_own_store" on public.purchases;
drop policy if exists "purchase_items_via_purchase" on public.purchase_items;
drop policy if exists "debts_all_own_store" on public.debts;
drop policy if exists "active_session_own_store" on public.active_cashier_sessions;

-- Acceso completo para rol anon (caja compartida / MVP)
create policy "anon_stores_all"
  on public.stores for all
  to anon
  using (true)
  with check (true);

create policy "anon_cashier_users_all"
  on public.cashier_users for all
  to anon
  using (true)
  with check (true);

create policy "anon_products_all"
  on public.products for all
  to anon
  using (true)
  with check (true);

create policy "anon_purchases_all"
  on public.purchases for all
  to anon
  using (true)
  with check (true);

create policy "anon_purchase_items_all"
  on public.purchase_items for all
  to anon
  using (true)
  with check (true);

create policy "anon_debts_all"
  on public.debts for all
  to anon
  using (true)
  with check (true);

create policy "anon_active_sessions_all"
  on public.active_cashier_sessions for all
  to anon
  using (true)
  with check (true);

-- También authenticated por si luego agregas login
create policy "auth_stores_all"
  on public.stores for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_cashier_users_all"
  on public.cashier_users for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_products_all"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_purchases_all"
  on public.purchases for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_purchase_items_all"
  on public.purchase_items for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_debts_all"
  on public.debts for all
  to authenticated
  using (true)
  with check (true);

create policy "auth_active_sessions_all"
  on public.active_cashier_sessions for all
  to authenticated
  using (true)
  with check (true);
