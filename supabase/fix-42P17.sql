-- Corrección error 42P17 (índices con expresiones no IMMUTABLE)
-- Ejecutar si schema.sql falló a mitad. Luego ejecuta el resto de schema.sql
-- desde "Catálogo de productos" o vuelve a correr schema.sql completo con
-- "DROP SCHEMA public CASCADE" solo si estás en desarrollo vacío.

drop index if exists public.cashier_users_store_cedula_unique;
drop index if exists public.purchases_store_date_idx;

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
