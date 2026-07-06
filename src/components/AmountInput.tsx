"use client";

import { useEffect, useRef } from "react";
import { AMOUNT_INPUT_ID } from "@/lib/calculator";
import { resolveCalculatorKey } from "@/lib/calculatorKeyboard";
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
  onClear?: () => void;
  onMultiply?: () => void;
  onEnter?: () => void;
  onFinish?: () => void;
  symbol?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  variant?: "light" | "display" | "microsoft";
  id?: string;
  hint?: string;
  secondary?: string;
  expression?: string;
};

export function AmountInput({
  value,
  onChange,
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onMultiply,
  onEnter,
  onFinish,
  symbol,
  className = "",
  placeholder = "0",
  autoFocus = false,
  size = "md",
  variant = "light",
  id,
  hint,
  secondary,
  expression,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMicrosoft = variant === "microsoft";
  const isDisplay = variant === "display";
  const textSize = isMicrosoft
    ? "text-[2.75rem] leading-none sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.25rem]"
    : size === "lg"
      ? "text-4xl sm:text-[2.75rem]"
      : "text-lg";

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
    const action = resolveCalculatorKey(e);
    if (!action) return;

    e.preventDefault();

    switch (action.type) {
      case "digit":
        handleDigit(action.digit);
        break;
      case "decimal":
        handleDecimal();
        break;
      case "backspace":
        handleBackspace();
        break;
      case "clear":
        onClear?.();
        break;
      case "multiply":
        onMultiply?.();
        break;
      case "add":
        onEnter?.();
        break;
      case "finish":
        onFinish?.();
        break;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text) return;
    onChange(formatAmountDisplay(text));
  };

  if (isMicrosoft) {
    return (
      <div
        className={`flex min-h-[7rem] flex-col justify-end px-4 pb-3 pt-2 lg:min-h-[10rem] lg:px-6 lg:pb-4 ${className}`}
        onClick={() => inputRef.current?.focus()}
      >
        {expression && (
          <p className="mb-1 truncate text-right text-sm text-[var(--calc-muted)] lg:text-base">
            {expression}
          </p>
        )}
        {(hint || secondary) && (
          <div className="mb-1 text-right">
            {hint && (
              <p className="truncate text-xs text-[var(--calc-muted)]">{hint}</p>
            )}
            {secondary && (
              <p className="truncate text-sm text-[var(--calc-muted)]">
                {secondary}
              </p>
            )}
          </div>
        )}
        <div className="flex items-end justify-end gap-1">
          {symbol && (
            <span className="mb-1 shrink-0 text-xl text-[var(--calc-muted)] sm:text-2xl">
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
            onPaste={handlePaste}
            className={`min-w-[2ch] flex-1 border-0 bg-transparent text-right font-light tabular-nums text-[#1a1a1a] outline-none placeholder:text-[#c8c6c4] ${textSize}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex cursor-text items-baseline justify-end gap-2 rounded-2xl px-3 py-3 transition-colors ${
        isDisplay
          ? "bg-gradient-to-br from-stone-800 to-stone-900 shadow-inner ring-1 ring-stone-700/50"
          : "border border-transparent focus-within:border-emerald-400 focus-within:bg-emerald-50/40"
      } ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {symbol && (
        <span
          className={`shrink-0 font-medium ${
            isDisplay
              ? "text-xl text-emerald-400/90 sm:text-2xl"
              : `text-stone-500 ${size === "lg" ? "text-2xl" : "text-lg"}`
          }`}
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
        onPaste={handlePaste}
        className={`min-w-[3ch] flex-1 border-0 bg-transparent text-right font-mono font-semibold tabular-nums outline-none ${textSize} ${
          isDisplay
            ? "text-white placeholder:text-stone-500"
            : "text-stone-900"
        }`}
      />
    </div>
  );
}

export function isValidAmount(value: string): boolean {
  return parseAmountInput(value) != null;
}

export { AMOUNT_INPUT_ID };
