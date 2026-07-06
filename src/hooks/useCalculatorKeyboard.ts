"use client";

import { useEffect } from "react";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";
import { resolveCalculatorKey } from "@/lib/calculatorKeyboard";

type Options = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onMultiply?: () => void;
  onEnter?: () => void;
  onFinish?: () => void;
  enabled?: boolean;
};

function focusAmountInput() {
  document.getElementById(AMOUNT_INPUT_ID)?.focus();
}

function dispatchCalculatorKey(
  action: ReturnType<typeof resolveCalculatorKey>,
  handlers: Pick<
    Options,
    | "onDigit"
    | "onDecimal"
    | "onBackspace"
    | "onClear"
    | "onMultiply"
    | "onEnter"
    | "onFinish"
  >,
) {
  if (!action) return;

  switch (action.type) {
    case "digit":
      handlers.onDigit(action.digit);
      focusAmountInput();
      break;
    case "decimal":
      handlers.onDecimal();
      focusAmountInput();
      break;
    case "backspace":
      handlers.onBackspace();
      focusAmountInput();
      break;
    case "clear":
      handlers.onClear();
      focusAmountInput();
      break;
    case "multiply":
      handlers.onMultiply?.();
      focusAmountInput();
      break;
    case "add":
      handlers.onEnter?.();
      break;
    case "finish":
      handlers.onFinish?.();
      break;
  }
}

/** Teclado físico en toda la caja (sin hacer clic en el monto). */
export function useCalculatorKeyboard({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onMultiply,
  onEnter,
  onFinish,
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

      const action = resolveCalculatorKey(e);
      if (!action) return;

      e.preventDefault();
      dispatchCalculatorKey(action, {
        onDigit,
        onDecimal,
        onBackspace,
        onClear,
        onMultiply,
        onEnter,
        onFinish,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onDigit,
    onDecimal,
    onBackspace,
    onClear,
    onMultiply,
    onEnter,
    onFinish,
    enabled,
  ]);
}
