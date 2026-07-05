/** Quita separadores de miles (punto) y deja la parte editable. */
export function stripThousands(value: string): string {
  return value.replace(/\./g, "");
}

/** Solo dígitos y una coma decimal (máx. 2 decimales). Acepta punto como coma. */
export function normalizeAmountRaw(value: string): string {
  let v = value.replace(/[^\d.,]/g, "");
  v = v.replace(/\./g, ",");

  const comma = v.indexOf(",");
  if (comma >= 0) {
    const intPart = v.slice(0, comma).replace(/,/g, "");
    const decPart = v.slice(comma + 1).replace(/,/g, "").slice(0, 2);
    return `${intPart},${decPart}`;
  }

  return v.replace(/,/g, "");
}

export function formatAmountDisplay(value: string): string {
  const raw = normalizeAmountRaw(stripThousands(value));
  if (!raw) return "";

  const comma = raw.indexOf(",");
  const intPart = comma >= 0 ? raw.slice(0, comma) : raw;
  const decPart = comma >= 0 ? raw.slice(comma + 1) : undefined;

  if (!intPart && decPart === undefined) return "";

  const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (decPart !== undefined) {
    return decPart.length > 0 ? `${formattedInt},${decPart}` : `${formattedInt},`;
  }

  return formattedInt;
}

export function parseAmountInput(value: string): number | null {
  const raw = normalizeAmountRaw(stripThousands(value));
  if (!raw || raw === ",") return null;

  const comma = raw.indexOf(",");
  let normalized: string;

  if (comma >= 0) {
    const intPart = raw.slice(0, comma) || "0";
    const decPart = raw.slice(comma + 1);
    normalized = decPart ? `${intPart}.${decPart}` : intPart;
  } else {
    normalized = raw;
  }

  const n = parseFloat(normalized);
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function appendAmountDigit(current: string, digit: string): string {
  const raw = normalizeAmountRaw(stripThousands(current));
  return formatAmountDisplay(raw + digit);
}

export function appendAmountDecimal(current: string): string {
  const raw = normalizeAmountRaw(stripThousands(current));
  if (raw.includes(",")) return formatAmountDisplay(raw);
  return formatAmountDisplay(raw ? `${raw},` : "0,");
}

export function appendAmountDoubleZero(current: string): string {
  const raw = normalizeAmountRaw(stripThousands(current));
  if (!raw) return formatAmountDisplay("0,00");
  if (raw.includes(",")) {
    const [, dec = ""] = raw.split(",");
    const next = (dec + "00").slice(0, 2);
    return formatAmountDisplay(`${raw.split(",")[0]},${next}`);
  }
  return formatAmountDisplay(`${raw},00`);
}

export function backspaceAmount(current: string): string {
  const raw = normalizeAmountRaw(stripThousands(current));
  if (!raw) return "";
  return formatAmountDisplay(raw.slice(0, -1));
}

export function numberToAmountInput(amount: number): string {
  const [int, dec] = amount.toFixed(2).split(".");
  const decTrim = dec.replace(/0+$/, "");
  const raw = decTrim ? `${int},${decTrim}` : int;
  return formatAmountDisplay(raw);
}

export function formatMoney(amount: number, symbol = "$"): string {
  const parts = amount.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = parts[1].replace(/0+$/, "");
  const formatted = dec ? `${intPart},${dec}` : intPart;
  return `${symbol}${formatted}`;
}

export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Etiquetas para gráficos diarios: nombre corto del día + número */
export function formatDayChartTick(dateKey: string): {
  weekday: string;
  dayNum: string;
  full: string;
  axis: string;
} {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdayRaw = date
    .toLocaleDateString("es", { weekday: "short" })
    .replace(/\.$/, "");
  const weekday =
    weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const dayNum = String(date.getDate());
  const full = formatDateLabel(dateKey);

  return {
    weekday,
    dayNum,
    full,
    axis: `${weekday} ${dayNum}`,
  };
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const weekday = date.toLocaleDateString("es", { weekday: "long" });
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const rest = date.toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${weekdayCap}, ${rest}`;
}

export function formatDateTimeFull(iso: string): string {
  const date = new Date(iso);
  const weekday = date.toLocaleDateString("es", { weekday: "long" });
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const rest = date.toLocaleString("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${weekdayCap}, ${rest}`;
}
