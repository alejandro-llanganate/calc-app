export const AMOUNT_INPUT_ID = "caja-amount";

export type CalcOperator = "multiply";

export function applyCalcOperation(
  left: number,
  right: number,
  op: CalcOperator,
): number {
  const result = op === "multiply" ? left * right : right;
  return Math.round(result * 100) / 100;
}

export function resolveCalcAmount(
  input: string,
  pendingLeft: number | null,
  pendingOp: CalcOperator | null,
  parse: (value: string) => number | null,
): number | null {
  const right = parse(input);
  if (pendingLeft != null && pendingOp != null) {
    if (right == null) return null;
    return applyCalcOperation(pendingLeft, right, pendingOp);
  }
  return right;
}
