# Caja Ventas

App para tiendas que quieren dejar la máquina de escribir con papel y registrar ventas en celular o tablet, con la misma facilidad que una calculadora.

**Sitio en producción:** [https://alejandro-llanganate.github.io/calc-app/](https://alejandro-llanganate.github.io/calc-app/)

## Características

- **Caja** (`/`): teclado numérico, botón **+** para sumar artículos, **Finalizar compra** guarda la compra completa con fecha y hora exacta.
- **Panel** (`/panel`): resumen, gráficos, productos, historial y ajustes.
- **Productos**: catálogo opcional (nombre y precio).
- **Historial**: ventas por día y descarga de respaldo JSON.
- **Persistencia**: `localStorage` en el navegador (sin servidor).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue en GitHub Pages (automático)

El workflow `.github/workflows/deploy.yml` construye y publica la app en cada push a `main`.

### Activar GitHub Pages (una sola vez)

1. En GitHub: **Settings → Pages**
2. **Build and deployment → Source:** elige **GitHub Actions**
3. Haz push a `main` (o ejecuta el workflow manualmente en **Actions**)

La URL será: `https://alejandro-llanganate.github.io/calc-app/`

### Probar el build de Pages en local

```bash
npm run build:pages
npx serve out
```

Abre la URL que indique `serve` (las rutas usan el prefijo `/calc-app`).

## Configuración de rutas e imágenes

| Archivo | Propósito |
|---------|-----------|
| `next.config.ts` | Export estático, `basePath` `/calc-app` en CI |
| `public/favicon.svg` | Icono del sitio |
| `public/icons/` | Iconos PWA 192 y 512 |
| `public/manifest.json` | App instalable en celular |
| `public/.nojekyll` | Evita que GitHub Pages ignore archivos con `_` |

Variable de entorno en CI: `GITHUB_PAGES=true`

## Datos

Claves en `localStorage`:

- `ventas-calc:purchases`
- `ventas-calc:products`
- `ventas-calc:settings`

Haz respaldos desde **Historial → Descargar respaldo** antes de cambiar de dispositivo.
