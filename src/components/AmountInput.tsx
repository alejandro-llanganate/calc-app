"use client";

import { useEffect, useRef } from "react";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";
import {
  appendAmountDecimal,
  appendAmountDigit,
  backspaceAmount,
  formatAmountDisplay,
  parseAmountInput,
} from "@/lib/format";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onDigit?: (digit: string) => void;
  onDecimal?: () => void;
  onBackspace?: () => void;
  onEnter?: () => void;
  symbol?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  id?: string;
};

export function AmountInput({
  value,
  onChange,
  onDigit,
  onDecimal,
  onBackspace,
  onEnter,
  symbol,
  className = "",
  placeholder = "0",
  autoFocus = false,
  size = "md",
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textSize = size === "lg" ? "text-4xl sm:text-5xl" : "text-lg";

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleDigit = (digit: string) => {
    if (onDigit) onDigit(digit);
    else onChange(appendAmountDigit(value, digit));
  };

  const handleDecimal = () => {
    if (onDecimal) onDecimal();
    else onChange(appendAmountDecimal(value));
  };

  const handleBackspace = () => {
    if (onBackspace) onBackspace();
    else onChange(backspaceAmount(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleDigit(e.key);
      return;
    }
    if (e.key === "," || e.key === ".") {
      e.preventDefault();
      handleDecimal();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      handleBackspace();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div
      className={`flex cursor-text items-baseline justify-end gap-2 rounded-xl border border-transparent px-2 py-1 focus-within:border-emerald-400 focus-within:bg-emerald-50/40 ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {symbol && (
        <span
          className={`shrink-0 text-stone-500 ${size === "lg" ? "text-2xl" : "text-lg"}`}
        >
          {symbol}
        </span>
      )}
      <input
        ref={inputRef}
        id={id ?? AMOUNT_INPUT_ID}
        type="text"
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(formatAmountDisplay(e.target.value))}
        onKeyDown={handleKeyDown}
        className={`min-w-[4ch] flex-1 border-0 bg-transparent text-right font-mono font-semibold text-stone-900 tabular-nums outline-none ${textSize}`}
      />
    </div>
  );
}

export function isValidAmount(value: string): boolean {
  return parseAmountInput(value) != null;
}

export { AMOUNT_INPUT_ID };
