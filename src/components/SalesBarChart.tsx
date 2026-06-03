"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/report";
import { formatDateLabel, formatMoney } from "@/lib/format";

type Props = {
  data: ChartPoint[];
  currencySymbol: string;
  barColor?: string;
  emptyMessage?: string;
  xInterval?: number | "preserveStartEnd";
  xDataKey?: "label" | "shortLabel";
  scrollable?: boolean;
  barSlotWidth?: number;
  height?: number;
};

type InnerProps = {
  data: ChartPoint[];
  currencySymbol: string;
  barColor: string;
  xInterval: number | "preserveStartEnd";
  xKey: string;
  scrollable: boolean;
  width?: number;
  height: number;
};

function ChartInner({
  data,
  currencySymbol,
  barColor,
  xInterval,
  xKey,
  scrollable,
  width,
  height,
}: InnerProps) {
  return (
    <BarChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 10, fill: "#78716c" }}
        axisLine={false}
        tickLine={false}
        interval={scrollable ? 0 : xInterval}
        minTickGap={scrollable ? 10 : 6}
      />
      <YAxis
        tick={{ fontSize: 10, fill: "#78716c" }}
        axisLine={false}
        tickLine={false}
        width={40}
        tickFormatter={(v) =>
          v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
        }
      />
      <Tooltip
        cursor={{ fill: "#f5f5f4" }}
        content={({ active, payload }) => {
          if (!active || !payload?.[0]) return null;
          const point = payload[0].payload as ChartPoint;
          const title =
            point.key.includes("-") && point.key.length === 10
              ? formatDateLabel(point.key)
              : point.label;
          return (
            <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm shadow-md">
              <p className="font-medium capitalize text-stone-900">{title}</p>
              <p className="text-emerald-700">
                {formatMoney(point.total, currencySymbol)}
              </p>
              <p className="text-xs text-stone-500">
                {point.count}{" "}
                {point.count === 1 ? "compra" : "compras"}
              </p>
            </div>
          );
        }}
      />
      <Bar
        dataKey="total"
        fill={barColor}
        radius={[6, 6, 0, 0]}
        maxBarSize={scrollable ? 32 : 28}
      />
    </BarChart>
  );
}

export function SalesBarChart({
  data,
  currencySymbol,
  barColor = "#059669",
  emptyMessage = "Sin ventas en este periodo",
  xInterval = 0,
  xDataKey = "label",
  scrollable = false,
  barSlotWidth = 48,
  height = 210,
}: Props) {
  const hasSales = data.some((d) => d.total > 0);

  if (!hasSales) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-stone-50 text-sm text-stone-500"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const xKey =
    xDataKey === "shortLabel" && data.some((d) => d.shortLabel)
      ? "shortLabel"
      : "label";

  const innerProps = {
    data,
    currencySymbol,
    barColor,
    xInterval,
    xKey,
    height,
  };

  if (scrollable) {
    const chartWidth = Math.max(data.length * barSlotWidth, 300);
    return (
      <div className="relative -mx-1">
        <div className="overflow-x-auto overscroll-x-contain px-1 pb-1">
          <ChartInner
            {...innerProps}
            scrollable
            width={chartWidth}
          />
        </div>
        <p className="mt-1 text-center text-[10px] text-stone-400">
          Desliza → para ver todos los días
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartInner {...innerProps} scrollable={false} />
      </ResponsiveContainer>
    </div>
  );
}
