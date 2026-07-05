"use client";

import { useEffect } from "react";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";

type Options = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onMultiply?: () => void;
  onEnter?: () => void;
  enabled?: boolean;
};

/** Teclado físico en toda la caja (sin hacer clic en el monto). */
export function useCalculatorKeyboard({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onMultiply,
  onEnter,
  enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName;
      const isAmount = target.id === AMOUNT_INPUT_ID;

      if (isAmount) return;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        onDigit(e.key);
        document.getElementById(AMOUNT_INPUT_ID)?.focus();
        return;
      }

      if (e.key === "," || e.key === "." || e.code === "NumpadDecimal") {
        e.preventDefault();
        onDecimal();
        document.getElementById(AMOUNT_INPUT_ID)?.focus();
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onBackspace();
        document.getElementById(AMOUNT_INPUT_ID)?.focus();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClear();
        document.getElementById(AMOUNT_INPUT_ID)?.focus();
        return;
      }

      if (e.key === "*" || e.key === "x" || e.key === "X") {
        e.preventDefault();
        onMultiply?.();
        document.getElementById(AMOUNT_INPUT_ID)?.focus();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        onEnter?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDigit, onDecimal, onBackspace, onClear, onMultiply, onEnter, enabled]);
}
