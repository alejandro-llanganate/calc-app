"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
};

export function BarcodeScannerModal({ open, onClose, onScan }: Props) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError("");

    (async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      if (cancelled) return;

      const scanner = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 280, height: 140 },
          },
          (text) => {
            onScan(text.trim());
            onClose();
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError(
            "No se pudo usar la cámara. Permite el acceso o escribe el código a mano.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().catch(() => {});
      }
    };
  }, [open, onScan, onClose, readerId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-stone-950/95">
      <div className="flex items-center justify-between px-4 py-3 text-white safe-top">
        <p className="text-sm font-medium">Escanear código de barras</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar escáner"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <div
          id={readerId}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-black"
        />
        <p className="mt-4 text-center text-sm text-stone-300">
          Apunta la cámara al código de barras del producto
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-red-500/20 px-4 py-2 text-center text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
