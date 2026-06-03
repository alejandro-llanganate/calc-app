"use client";

type KeypadProps = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onAddItem: () => void;
  addDisabled?: boolean;
};

const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0"];

export function CalculatorKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onAddItem,
  addDisabled,
}: KeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Key variant="muted" className="col-span-1" onClick={onClear}>
        C
      </Key>
      <Key variant="muted" className="col-span-1" onClick={onBackspace}>
        ⌫
      </Key>
      <Key variant="muted" className="col-span-1" onClick={onDecimal}>
        ,
      </Key>
      <Key
        variant="accent"
        className="col-span-1 row-span-2 min-h-[7.5rem] text-3xl"
        onClick={onAddItem}
        disabled={addDisabled}
      >
        +
      </Key>

      {digitKeys.map((d) => (
        <Key
          key={d}
          variant="digit"
          className={d === "0" ? "col-span-3" : ""}
          onClick={() => onDigit(d)}
        >
          {d}
        </Key>
      ))}
    </div>
  );
}

function Key({
  children,
  onClick,
  variant = "digit",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "digit" | "muted" | "accent";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    digit: "bg-stone-100 text-stone-900 active:bg-stone-200",
    muted: "bg-stone-200 text-stone-700 active:bg-stone-300",
    accent:
      "bg-emerald-600 text-white active:bg-emerald-700 disabled:bg-stone-300 disabled:text-stone-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[3.75rem] items-center justify-center rounded-2xl text-2xl font-medium shadow-sm transition-colors select-none touch-manipulation ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
