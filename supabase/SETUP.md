# Supabase — Caja Ventas

## 1. Crear tablas

En [Supabase Dashboard](https://supabase.com/dashboard/project/yjscmdlwtcptushjirby/sql/new):

1. Pega y ejecuta **`schema.sql`**
2. Pega y ejecuta **`policies-anon.sql`**

## 2. Credenciales en la app

La app usa la URL y la **clave anon** hardcodeadas en:

`src/lib/supabase/config.ts`

No uses la **service role** en el navegador: cualquiera podría leerla en el código fuente.

## 3. Verificar

Tras ejecutar los SQL, recarga la app. Debería mostrar la caja normalmente (sin pantalla roja de error).

La primera carga crea automáticamente la tienda y usuarios por defecto (Alejandro, María, Luis).

## 4. Datos sincronizados

| Dato | Supabase |
|------|----------|
| Ventas, debes, usuarios, productos, ajustes | ✅ |
| Usuario activo en caja (sesión local) | Solo este dispositivo |
