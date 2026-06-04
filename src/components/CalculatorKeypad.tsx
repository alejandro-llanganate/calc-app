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
  "flex items-center justify-center rounded-full bg-white font-semibold text-stone-800 ring-1 ring-stone-200 transition-all duration-150 select-none touch-manipulation active:scale-[0.88] active:bg-stone-50";

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
    <div className="mx-auto w-full max-w-[21.5rem] bg-white sm:max-w-[23rem]">
      <div className="grid grid-cols-4 items-center justify-items-center gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
        <Key onClick={onClear} className="text-xl" aria-label="Limpiar">
          C
        </Key>
        <Key onClick={onBackspace} aria-label="Borrar">
          <Delete className="h-5 w-5" strokeWidth={2.25} />
        </Key>
        <Key onClick={onDecimal} className="text-xl" aria-label="Coma decimal">
          ,
        </Key>
        <Key
          onClick={onAddItem}
          disabled={addDisabled}
          className="row-span-2 h-[calc(10.5rem+1rem)] w-[5rem] text-emerald-600 disabled:text-stone-400 sm:h-[calc(11.2rem+1.25rem)] sm:w-[5.35rem]"
          aria-label="Sumar artículo"
        >
          <Plus className="h-9 w-9" strokeWidth={2.5} />
        </Key>

        {digitKeys.map((d) => (
          <Key key={d} onClick={() => onDigit(d)}>
            {d}
          </Key>
        ))}

        <Key
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
  className = "",
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${BTN} ${KEY_SIZE} text-3xl disabled:text-stone-400 disabled:active:bg-white ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
