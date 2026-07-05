"use client";

import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/context/AppDataProvider";
import type { AppSettings } from "@/lib/types";

export default function ConfiguracionPage() {
  const { ready, settings, setSettings, toggleItemDetails } = useAppData();

  if (!ready) {
    return (
      <AppShell>
        <p className="py-8 text-center text-stone-500">Cargando…</p>
      </AppShell>
    );
  }

  const update = (patch: Partial<AppSettings>) => {
    setSettings({ ...settings, ...patch });
  };

  const updateFeature = (
    key: keyof AppSettings["features"],
    value: boolean,
  ) => {
    setSettings({
      ...settings,
      features: { ...settings.features, [key]: value },
    });
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Configuración</h1>

        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <label className="block">
            <span className="text-sm text-stone-600">Nombre de la tienda</span>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => update({ storeName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-600">Símbolo de moneda</span>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => update({ currencySymbol: e.target.value })}
              className="mt-1 w-full max-w-[6rem] rounded-xl border border-stone-200 px-3 py-3 text-center text-lg"
              maxLength={4}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-900">Caja</h2>
          <p className="mt-1 text-sm text-stone-600">
            Opciones que cambian cómo registras ventas en el día a día.
          </p>

          <FeatureToggle
            label="Nombres y sugerencias de producto"
            description="Muestra nombre, sugerencias del catálogo y opción de guardar productos nuevos. También puedes activarlo con el botón Detalle en Caja."
            enabled={settings.features.itemDetails}
            onChange={(v) => toggleItemDetails(v)}
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-900">Funciones futuras</h2>
          <p className="mt-1 text-sm text-stone-600">
            Puedes activarlas cuando quieras preparar la tienda. Aún no están
            implementadas.
          </p>

          <FeatureToggle
            label="Escáner de código de barras"
            description="Fase 2: sumar precio leyendo el código con el celular."
            enabled={settings.features.barcodeScanner}
            onChange={(v) => updateFeature("barcodeScanner", v)}
            phase="Fase 2"
            future
          />
          <FeatureToggle
            label="Facturación"
            description="Fase 3: emitir facturas desde la misma app."
            enabled={settings.features.invoicing}
            onChange={(v) => updateFeature("invoicing", v)}
            phase="Fase 3"
            future
          />
        </section>

        <p className="text-xs text-[var(--calc-muted)]">
          Datos sincronizados con Supabase. El usuario activo en caja se guarda
          solo en este dispositivo.
        </p>
      </div>
    </AppShell>
  );
}

function FeatureToggle({
  label,
  description,
  enabled,
  onChange,
  phase,
  future,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  phase?: string;
  future?: boolean;
}) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3 border-t border-stone-100 pt-4 first:mt-0 first:border-0 first:pt-0">
      <div>
        <p className="font-medium text-stone-900">
          {label}{" "}
          {phase && (
            <span className="text-xs font-normal text-stone-400">
              ({phase})
            </span>
          )}
        </p>
        <p className="text-sm text-stone-600">{description}</p>
        {future && enabled && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Activado — disponible en una próxima versión
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-emerald-600" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
