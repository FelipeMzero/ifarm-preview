"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AnimalWeighing } from "./services";

const chartConfig = {
  weightKg: { label: "Peso", color: "var(--primary)" },
} satisfies ChartConfig;

const formatShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

const formatFullDate = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR");

export function AnimalWeightChart({
  weighings,
}: {
  weighings: AnimalWeighing[];
}) {
  const data = weighings.map((w) => ({
    ts: new Date(w.date).getTime(),
    weightKg: w.weightKg,
  }));

  const weights = data.map((d) => d.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  // Margem de 10% da amplitude para a linha não encostar nas bordas.
  const pad = Math.max((max - min) * 0.1, 5);
  const domain = [
    Math.max(0, Math.floor((min - pad) / 10) * 10),
    Math.ceil((max + pad) / 10) * 10,
  ];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0 }}>
        <defs>
          <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-weightKg)"
              stopOpacity={0.18}
            />
            <stop
              offset="100%"
              stopColor="var(--color-weightKg)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatShortDate}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <YAxis
          domain={domain}
          tickFormatter={(v: number) => `${v} kg`}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={64}
        />
        <ChartTooltip
          cursor={{ strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) =>
                formatFullDate(payload?.[0]?.payload?.ts)
              }
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Peso</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {Number(value).toLocaleString("pt-BR")} kg
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="weightKg"
          type="linear"
          stroke="var(--color-weightKg)"
          strokeWidth={2}
          fill="url(#fillWeight)"
          dot={{
            r: 4,
            fill: "var(--color-weightKg)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: "var(--color-weightKg)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
