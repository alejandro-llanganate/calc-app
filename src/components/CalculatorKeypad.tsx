"use client";

import { Delete, Plus } from "lucide-react";

type KeypadProps = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onDoubleZero?: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onMultiply: () => void;
  onAddItem: () => void;
  onFinish?: () => void;
  addDisabled?: boolean;
  finishDisabled?: boolean;
  multiplyActive?: boolean;
  className?: string;
};

const digitRows = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
] as const;

const KEY =
  "calc-key flex min-h-[3.25rem] items-center justify-center text-2xl font-normal text-[#1a1a1a] transition-colors select-none touch-manipulation sm:min-h-[3.5rem] sm:text-[1.65rem] lg:min-h-0 lg:h-full lg:text-[1.85rem] xl:text-[2rem]";

const SYM =
  "calc-key flex min-h-0 h-full items-center justify-center text-[3rem] font-light leading-none select-none touch-manipulation sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.25rem]";

export function CalculatorKeypad({
  onDigit,
  onDecimal,
  onDoubleZero,
  onBackspace,
  onClear,
  onMultiply,
  onAddItem,
  onFinish,
  addDisabled,
  finishDisabled,
  multiplyActive,
  className = "",
}: KeypadProps) {
  return (
    <div
      className={`grid flex-1 grid-cols-4 grid-rows-5 gap-px bg-[var(--calc-border)] ${className}`}
    >
      <button type="button" onClick={onClear} className={`${KEY} calc-key-fn`}>
        C
      </button>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="Borrar"
        className={`${KEY} calc-key-fn`}
      >
        <Delete className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onDoubleZero}
        className={`${KEY} calc-key-fn text-lg`}
        aria-label="Dos ceros"
      >
        00
      </button>
      <button
        type="button"
        onClick={onMultiply}
        className={`${SYM} ${
          multiplyActive
            ? "bg-[#deecf9] text-[var(--calc-accent)] ring-1 ring-inset ring-[var(--calc-accent)]"
            : "text-[var(--calc-muted)]"
        }`}
        aria-label="Multiplicar"
      >
        ×
      </button>

      {digitRows[0].map((d) => (
        <button key={d} type="button" onClick={() => onDigit(d)} className={KEY}>
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onAddItem}
        disabled={addDisabled}
        className={`${KEY} calc-key-accent row-span-3 disabled:opacity-100`}
        aria-label="Sumar artículo"
      >
        <Plus className="h-10 w-10 lg:h-11 lg:w-11" strokeWidth={1.5} />
      </button>

      {digitRows.slice(1).flatMap((row) =>
        row.map((d) => (
          <button key={d} type="button" onClick={() => onDigit(d)} className={KEY}>
            {d}
          </button>
        )),
      )}

      <button
        type="button"
        onClick={() => onDigit("0")}
        className={`${KEY} col-span-2`}
      >
        0
      </button>
      <button
        type="button"
        onClick={onDecimal}
        className={`${SYM} text-[var(--calc-accent)]`}
        aria-label="Coma decimal"
      >
        ,
      </button>
      <button
        type="button"
        onClick={onFinish}
        disabled={finishDisabled}
        className={`${SYM} calc-key-accent disabled:opacity-100`}
        aria-label="Finalizar compra"
      >
        =
      </button>
    </div>
  );
}
