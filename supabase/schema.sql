-- =============================================================================
-- Caja Ventas — esquema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================
-- Modelo alineado con la app Next.js (localStorage → sync futuro)
-- Tablas: stores, cashier_users, purchases, purchase_items, products, debts
-- =============================================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.payment_method as enum ('cash', 'transfer', 'card', 'deuna');
create type public.debt_status as enum ('pending', 'paid');

-- -----------------------------------------------------------------------------
-- Tiendas / configuración
-- -----------------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi tienda',
  currency_symbol text not null default '$',
  features jsonb not null default '{
    "itemDetails": false,
    "barcodeScanner": false,
    "invoicing": false
  }'::jsonb,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.stores is 'Tienda o negocio; una fila por negocio en Supabase.';

-- -----------------------------------------------------------------------------
-- Usuarios de caja (cajeros)
-- -----------------------------------------------------------------------------
create table public.cashier_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  cedula text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cashier_users_name_not_empty check (char_length(trim(name)) > 0)
);

-- Normalización inmutable para índice único de cédula
create or replace function public.normalize_cedula(c text)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when c is null or btrim(c) = '' then null
    else lower(btrim(c))
  end;
$$;

create unique index cashier_users_store_cedula_unique
  on public.cashier_users (store_id, public.normalize_cedula(cedula))
  where public.normalize_cedula(cedula) is not null;

comment on table public.cashier_users is 'Personas que registran ventas en la caja.';

-- -----------------------------------------------------------------------------
-- Catálogo de productos (opcional; modo Detalle en caja)
-- -----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  barcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_empty check (char_length(trim(name)) > 0)
);

create index products_store_id_idx on public.products (store_id);
create unique index products_store_barcode_unique
  on public.products (store_id, barcode)
  where barcode is not null and trim(barcode) <> '';

-- -----------------------------------------------------------------------------
-- Compras / ventas finalizadas
-- -----------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  cashier_user_id uuid references public.cashier_users (id) on delete set null,
  registered_by_name text,
  total numeric(12, 2) not null check (total >= 0),
  payment_method public.payment_method,
  created_at timestamptz not null default now()
);

create index purchases_store_created_idx
  on public.purchases (store_id, created_at desc);

-- Nota: no usar (created_at::date) en índice — el cast timestamptz→date no es IMMUTABLE

comment on column public.purchases.payment_method is
  'Opcional: cash = efectivo, transfer = transferencia. NULL = sin especificar.';

-- -----------------------------------------------------------------------------
-- Líneas de cada compra
-- -----------------------------------------------------------------------------
create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  sort_order integer not null default 0
);

create index purchase_items_purchase_id_idx
  on public.purchase_items (purchase_id);

-- -----------------------------------------------------------------------------
-- Debes / fiados
-- -----------------------------------------------------------------------------
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  debtor_name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  status public.debt_status not null default 'pending',
  note text,
  cashier_user_id uuid references public.cashier_users (id) on delete set null,
  registered_by_name text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint debts_paid_not_exceed_amount check (amount_paid <= amount)
);

create index debts_store_status_idx
  on public.debts (store_id, status);

create index debts_store_created_idx
  on public.debts (store_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Sesión activa de caja (equivalente a ventas-calc:active-user)
-- -----------------------------------------------------------------------------
create table public.active_cashier_sessions (
  store_id uuid primary key references public.stores (id) on delete cascade,
  cashier_user_id uuid not null references public.cashier_users (id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Trigger: updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

create trigger cashier_users_set_updated_at
  before update on public.cashier_users
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: total de compra = suma de ítems
-- -----------------------------------------------------------------------------
create or replace function public.sync_purchase_total()
returns trigger
language plpgsql
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.purchase_id, old.purchase_id);
  update public.purchases p
  set total = coalesce((
    select sum(pi.amount)
    from public.purchase_items pi
    where pi.purchase_id = pid
  ), 0)
  where p.id = pid;
  return coalesce(new, old);
end;
$$;

create trigger purchase_items_sync_total
  after insert or update or delete on public.purchase_items
  for each row execute function public.sync_purchase_total();

-- -----------------------------------------------------------------------------
-- Trigger: marcar debe como pagado
-- -----------------------------------------------------------------------------
create or replace function public.debts_mark_paid()
returns trigger
language plpgsql
as $$
begin
  if new.amount_paid >= new.amount and new.status = 'pending' then
    new.status := 'paid';
    new.paid_at := coalesce(new.paid_at, now());
  end if;
  return new;
end;
$$;

create trigger debts_before_update_paid
  before update on public.debts
  for each row execute function public.debts_mark_paid();

-- -----------------------------------------------------------------------------
-- Funciones de reporte (equivalente a lib/report.ts)
-- -----------------------------------------------------------------------------

-- Ventas de un día (date en zona local del cliente; pasar date ya calculado)
create or replace function public.daily_sales_report(
  p_store_id uuid,
  p_date date
)
returns table (
  total numeric,
  purchase_count bigint
)
language sql
stable
as $$
  select
    coalesce(sum(p.total), 0)::numeric as total,
    count(*)::bigint as purchase_count
  from public.purchases p
  where p.store_id = p_store_id
    and p.created_at::date = p_date;
$$;

-- Ventas por hora de un día
create or replace function public.hourly_sales_report(
  p_store_id uuid,
  p_date date
)
returns table (
  hour_of_day integer,
  total numeric,
  purchase_count bigint
)
language sql
stable
as $$
  select
    extract(hour from p.created_at)::integer as hour_of_day,
    coalesce(sum(p.total), 0)::numeric as total,
    count(*)::bigint as purchase_count
  from public.purchases p
  where p.store_id = p_store_id
    and p.created_at::date = p_date
  group by 1
  order by 1;
$$;

-- Ventas por día en un rango
create or replace function public.daily_sales_range(
  p_store_id uuid,
  p_from date,
  p_to date
)
returns table (
  day date,
  total numeric,
  purchase_count bigint
)
language sql
stable
as $$
  select
    p.created_at::date as day,
    coalesce(sum(p.total), 0)::numeric as total,
    count(*)::bigint as purchase_count
  from public.purchases p
  where p.store_id = p_store_id
    and p.created_at::date between p_from and p_to
  group by 1
  order by 1;
$$;

-- Resumen de debes
create or replace function public.debt_summary(p_store_id uuid)
returns table (
  total_lent numeric,
  total_paid numeric,
  total_pending numeric,
  count_pending bigint,
  count_paid bigint
)
language sql
stable
as $$
  select
    coalesce(sum(d.amount), 0)::numeric as total_lent,
    coalesce(sum(d.amount_paid), 0)::numeric as total_paid,
    coalesce(sum(greatest(d.amount - d.amount_paid, 0)), 0)::numeric as total_pending,
    count(*) filter (where d.status = 'pending')::bigint as count_pending,
    count(*) filter (where d.status = 'paid')::bigint as count_paid
  from public.debts d
  where d.store_id = p_store_id;
$$;

-- Ventas por forma de pago en un rango
create or replace function public.sales_by_payment_method(
  p_store_id uuid,
  p_from date,
  p_to date
)
returns table (
  payment_method public.payment_method,
  total numeric,
  purchase_count bigint
)
language sql
stable
as $$
  select
    p.payment_method,
    coalesce(sum(p.total), 0)::numeric as total,
    count(*)::bigint as purchase_count
  from public.purchases p
  where p.store_id = p_store_id
    and p.created_at::date between p_from and p_to
  group by p.payment_method
  order by p.payment_method nulls first;
$$;

-- Vista: historial unificado (ventas + debes) por día
create or replace view public.store_activity_timeline as
select
  p.store_id,
  p.id as activity_id,
  'purchase'::text as kind,
  p.created_at as occurred_at,
  p.total as amount,
  p.registered_by_name,
  p.payment_method::text as payment_method,
  null::text as debtor_name,
  null::public.debt_status as debt_status
from public.purchases p
union all
select
  d.store_id,
  d.id as activity_id,
  'debt'::text as kind,
  d.created_at as occurred_at,
  d.amount,
  d.registered_by_name,
  null::text as payment_method,
  d.debtor_name,
  d.status as debt_status
from public.debts d
union all
select
  d.store_id,
  d.id as activity_id,
  'debt_paid'::text as kind,
  d.paid_at as occurred_at,
  d.amount,
  d.registered_by_name,
  null::text as payment_method,
  d.debtor_name,
  d.status as debt_status
from public.debts d
where d.paid_at is not null;

-- -----------------------------------------------------------------------------
-- RPC: finalizar compra (transacción atómica)
-- -----------------------------------------------------------------------------
create or replace function public.finalize_purchase(
  p_store_id uuid,
  p_cashier_user_id uuid,
  p_registered_by_name text,
  p_payment_method public.payment_method,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_item jsonb;
  v_sort integer := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra debe tener al menos un ítem';
  end if;

  insert into public.purchases (
    store_id,
    cashier_user_id,
    registered_by_name,
    payment_method,
    total
  )
  values (
    p_store_id,
    p_cashier_user_id,
    p_registered_by_name,
    p_payment_method,
    0
  )
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.purchase_items (
      purchase_id,
      product_id,
      amount,
      note,
      sort_order
    )
    values (
      v_purchase_id,
      nullif(v_item->>'product_id', '')::uuid,
      (v_item->>'amount')::numeric,
      nullif(v_item->>'note', ''),
      v_sort
    );
    v_sort := v_sort + 1;
  end loop;

  return v_purchase_id;
end;
$$;

-- RPC: registrar debe
create or replace function public.register_debt(
  p_store_id uuid,
  p_debtor_name text,
  p_amount numeric,
  p_note text default null,
  p_cashier_user_id uuid default null,
  p_registered_by_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if trim(p_debtor_name) = '' then
    raise exception 'Nombre del deudor requerido';
  end if;
  if p_amount <= 0 then
    raise exception 'Monto debe ser mayor a cero';
  end if;

  insert into public.debts (
    store_id,
    debtor_name,
    amount,
    note,
    cashier_user_id,
    registered_by_name
  )
  values (
    p_store_id,
    trim(p_debtor_name),
    p_amount,
    nullif(trim(p_note), ''),
    p_cashier_user_id,
    p_registered_by_name
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- RPC: marcar debe pagado
create or replace function public.mark_debt_paid(p_debt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.debts
  set
    amount_paid = amount,
    status = 'paid',
    paid_at = now()
  where id = p_debt_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Ajusta según tu modelo de auth (owner por tienda)
-- -----------------------------------------------------------------------------
alter table public.stores enable row level security;
alter table public.cashier_users enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.debts enable row level security;
alter table public.active_cashier_sessions enable row level security;

-- Helper: el usuario autenticado es dueño de la tienda
create or replace function public.user_owns_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.owner_id = auth.uid()
  );
$$;

-- Políticas para stores
create policy "stores_select_own"
  on public.stores for select
  using (owner_id = auth.uid());

create policy "stores_insert_own"
  on public.stores for insert
  with check (owner_id = auth.uid());

create policy "stores_update_own"
  on public.stores for update
  using (owner_id = auth.uid());

-- Políticas genéricas por store_id (repetir patrón)
create policy "cashier_users_all_own_store"
  on public.cashier_users for all
  using (public.user_owns_store(store_id))
  with check (public.user_owns_store(store_id));

create policy "products_all_own_store"
  on public.products for all
  using (public.user_owns_store(store_id))
  with check (public.user_owns_store(store_id));

create policy "purchases_all_own_store"
  on public.purchases for all
  using (public.user_owns_store(store_id))
  with check (public.user_owns_store(store_id));

create policy "purchase_items_via_purchase"
  on public.purchase_items for all
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.user_owns_store(p.store_id)
    )
  )
  with check (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.user_owns_store(p.store_id)
    )
  );

create policy "debts_all_own_store"
  on public.debts for all
  using (public.user_owns_store(store_id))
  with check (public.user_owns_store(store_id));

create policy "active_session_own_store"
  on public.active_cashier_sessions for all
  using (public.user_owns_store(store_id))
  with check (public.user_owns_store(store_id));

-- -----------------------------------------------------------------------------
-- Datos iniciales de ejemplo (opcional; comentar en producción)
-- -----------------------------------------------------------------------------
-- insert into public.stores (name, currency_symbol)
-- values ('Mi tienda', '$')
-- returning id;
-- Usar el id devuelto para insertar cashier_users.

-- -----------------------------------------------------------------------------
-- Realtime (opcional): habilitar sync en vivo
-- -----------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.purchases;
-- alter publication supabase_realtime add table public.debts;

-- =============================================================================
-- Próximo paso en la app:
-- 1. npm install @supabase/supabase-js
-- 2. Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 3. Sustituir lib/storage.ts por capa que lea/escriba estas tablas
-- =============================================================================
