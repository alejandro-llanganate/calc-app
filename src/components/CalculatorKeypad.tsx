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

const digitAccent: Record<string, string> = {
  "7": "from-sky-100 to-white ring-sky-200/70 text-sky-900",
  "8": "from-indigo-50 to-white ring-indigo-200/60 text-indigo-900",
  "9": "from-violet-50 to-white ring-violet-200/60 text-violet-900",
  "4": "from-teal-50 to-white ring-teal-200/60 text-teal-900",
  "5": "from-emerald-50 to-white ring-emerald-200/70 text-emerald-900",
  "6": "from-lime-50 to-white ring-lime-200/60 text-lime-900",
  "1": "from-amber-50 to-white ring-amber-200/70 text-amber-900",
  "2": "from-orange-50 to-white ring-orange-200/60 text-orange-900",
  "3": "from-rose-50 to-white ring-rose-200/60 text-rose-900",
  "0": "from-stone-100 to-white ring-stone-300/70 text-stone-900",
};

const BTN =
  "flex items-center justify-center rounded-full font-semibold transition-all duration-150 select-none touch-manipulation active:scale-[0.88]";

const KEY_SIZE = "h-[5rem] w-[5rem] sm:h-[5.35rem] sm:w-[5.35rem]";

export function CalculatorKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onAddItem,
  addDisabled,
}: KeypadProps) {
  return (
    <div className="mx-auto w-full max-w-[21.5rem] sm:max-w-[23rem]">
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
          className="row-span-2 h-[calc(10.5rem+1rem)] w-[5rem] sm:h-[calc(11.2rem+1.25rem)] sm:w-[5.35rem]"
          aria-label="Sumar artículo"
        >
          <Plus className="h-9 w-9" strokeWidth={2.5} />
        </Key>

        {digitKeys.map((d) => (
          <Key key={d} variant="digit" digit={d} onClick={() => onDigit(d)}>
            {d}
          </Key>
        ))}

        <Key
          variant="digit"
          digit="0"
          onClick={() => onDigit("0")}
          className="col-span-2 h-[5rem] w-[10.75rem] max-w-none text-3xl sm:h-[5.35rem] sm:w-[11.5rem]"
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
  digit,
  className = "",
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "digit" | "muted" | "accent";
  digit?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const base = `${BTN} ${KEY_SIZE} text-3xl`;

  const styles = {
    digit: digit
      ? `bg-gradient-to-b ${digitAccent[digit]} shadow-[0_5px_16px_rgba(28,25,23,0.1)] ring-2`
      : "bg-white text-stone-800 shadow-[0_5px_16px_rgba(28,25,23,0.1)] ring-2 ring-stone-200/80",
    muted:
      "bg-stone-200/95 text-stone-600 text-xl shadow-[0_4px_12px_rgba(28,25,23,0.08)] ring-2 ring-stone-300/50",
    accent:
      "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-3xl shadow-[0_8px_24px_rgba(5,150,105,0.5)] ring-2 ring-emerald-400/40 disabled:from-stone-300 disabled:to-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:ring-stone-200",
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
