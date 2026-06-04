"use client";

import { Delete, Plus } from "lucide-react";

type KeypadProps = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onAddItem: () => void;
  addDisabled?: boolean;
};

const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

const BTN =
  "flex items-center justify-center rounded-full font-medium transition-all duration-150 select-none touch-manipulation active:scale-90";

export function CalculatorKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onAddItem,
  addDisabled,
}: KeypadProps) {
  return (
    <div className="mx-auto w-full max-w-[18.5rem] sm:max-w-[20rem]">
      <div className="grid grid-cols-4 items-center justify-items-center gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
        <Key variant="muted" onClick={onClear} aria-label="Limpiar">
          C
        </Key>
        <Key variant="muted" onClick={onBackspace} aria-label="Borrar">
          <Delete className="h-5 w-5" strokeWidth={2.25} />
        </Key>
        <Key variant="muted" onClick={onDecimal} aria-label="Coma decimal">
          ,
        </Key>
        <Key
          variant="accent"
          onClick={onAddItem}
          disabled={addDisabled}
          className="row-span-2 h-[calc(8.25rem+1rem)] w-[4.25rem] text-3xl sm:h-[calc(9rem+1.25rem)] sm:w-[4.75rem]"
          aria-label="Sumar artículo"
        >
          <Plus className="h-8 w-8" strokeWidth={2.5} />
        </Key>

        {digitKeys.map((d) => (
          <Key key={d} variant="digit" onClick={() => onDigit(d)}>
            {d}
          </Key>
        ))}

        <Key
          variant="digit"
          onClick={() => onDigit("0")}
          className="col-span-2 h-[4.25rem] w-[9.25rem] max-w-none sm:h-[4.75rem] sm:w-[10.25rem]"
        >
          0
        </Key>
      </div>
    </div>
  );
}

function Key({
  children,
  onClick,
  variant = "digit",
  className = "",
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "digit" | "muted" | "accent";
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const base = `${BTN} h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem]`;

  const styles = {
    digit:
      "bg-white text-stone-800 text-2xl shadow-[0_4px_14px_rgba(28,25,23,0.08)] ring-1 ring-stone-200/80 hover:bg-stone-50 active:shadow-inner",
    muted:
      "bg-stone-200/90 text-stone-600 text-lg shadow-[0_3px_10px_rgba(28,25,23,0.06)] ring-1 ring-stone-300/50 active:bg-stone-300",
    accent:
      "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_6px_20px_rgba(5,150,105,0.45)] ring-2 ring-emerald-400/30 disabled:from-stone-300 disabled:to-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:ring-stone-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
