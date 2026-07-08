export type CalculatorKeyAction =
  | { type: "digit"; digit: string }
  | { type: "decimal" }
  | { type: "backspace" }
  | { type: "clear" }
  | { type: "multiply" }
  | { type: "add" }
  | { type: "finish" };

type KeyEventLike = Pick<KeyboardEvent, "key" | "code" | "shiftKey">;

function digitFromEvent(e: KeyEventLike): string | null {
  if (/^[0-9]$/.test(e.key)) return e.key;

  const numpad = e.code.match(/^Numpad([0-9])$/);
  if (numpad) return numpad[1];

  // Fila numérica: solo si el carácter es un dígito (Shift+8 → * no es "8")
  const digit = e.code.match(/^Digit([0-9])$/);
  if (digit && e.key === digit[1]) return digit[1];

  return null;
}

function isDecimalKey(e: KeyEventLike): boolean {
  return (
    e.key === "," ||
    e.key === "." ||
    e.key === "Decimal" ||
    e.code === "NumpadDecimal" ||
    e.code === "Comma" ||
    e.code === "Period"
  );
}

function isMultiplyKey(e: KeyEventLike): boolean {
  return (
    e.key === "*" ||
    e.key === "×" ||
    e.key === "x" ||
    e.key === "X" ||
    e.code === "NumpadMultiply" ||
    (e.code === "Digit8" && e.shiftKey)
  );
}

function isAddKey(e: KeyEventLike): boolean {
  return (
    e.key === "+" ||
    e.code === "NumpadAdd" ||
    (e.code === "Equal" && e.shiftKey)
  );
}

function isFinishKey(e: KeyEventLike): boolean {
  return (
    e.key === "Enter" ||
    e.code === "NumpadEnter" ||
    ((e.key === "=" || e.code === "NumpadEqual") && !e.shiftKey)
  );
}

/** Traduce una tecla física a acción de calculadora (números, coma, operaciones). */
export function resolveCalculatorKey(
  e: KeyEventLike,
): CalculatorKeyAction | null {
  if (isDecimalKey(e)) return { type: "decimal" };

  if (e.key === "Backspace" || e.key === "Delete") {
    return { type: "backspace" };
  }

  if (e.key === "Escape" || e.key === "c" || e.key === "C") {
    return { type: "clear" };
  }

  if (isMultiplyKey(e)) return { type: "multiply" };

  if (isAddKey(e)) return { type: "add" };

  if (isFinishKey(e)) return { type: "finish" };

  const digit = digitFromEvent(e);
  if (digit) return { type: "digit", digit };

  return null;
}
