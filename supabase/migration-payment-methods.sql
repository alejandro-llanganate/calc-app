-- Nuevas formas de pago: tarjeta y DeUna
-- Ejecutar en Supabase SQL Editor si ya creaste la base antes

alter type public.payment_method add value if not exists 'card';
alter type public.payment_method add value if not exists 'deuna';
