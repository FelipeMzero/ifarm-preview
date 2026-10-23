import { toLocalDay } from "@ifarm/shared";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DAY_MS } from "@/features/animal/format";
import { timeDomain, timeTicks } from "@/lib/time-domain";
import type { BatchProjection } from "@ifarm/shared";

const chartConfig = {
  avgWeightKg: { label: "Peso médio", color: "var(--primary)" },
  projectedKg: { label: "Projeção", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

// A projeção não se estende indefinidamente quando a meta está muito longe.
const MAX_PROJECTION_DAYS = 730;

const formatShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

type Point = {
  ts: number;
  avgWeightKg?: number;
  animalCount?: number;
  projectedKg?: number;
};

export function BatchGoalChart({
  series,
  projection,
}: {
  series: { date: string; avgWeightKg: number; animalCount: number }[];
  projection: BatchProjection;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const history: Point[] = series.map((p) => ({
    ts: toLocalDay(p.date).getTime(),
    avgWeightKg: p.avgWeightKg,
    animalCount: p.animalCount,
  }));

  const targetTs = projection.targetDate
    ? toLocalDay(projection.targetDate).getTime()
    : null;

  // Linha de projeção: de hoje até a data da meta ou a data estimada (a mais distante).
  const projected: Point[] = [];
  const startKg = projection.projectAt(today);
  if (startKg != null) {
    const candidates = [
      targetTs,
      projection.estimatedDate?.getTime() ?? null,
      today.getTime() + 30 * DAY_MS,
    ].filter((t): t is number => t != null && t > today.getTime());
    const endTs = Math.min(
      Math.max(...candidates),
      today.getTime() + MAX_PROJECTION_DAYS * DAY_MS,
    );
    const stops = new Set([today.getTime(), endTs]);
    if (targetTs && targetTs > today.getTime() && targetTs <= endTs) {
      stops.add(targetTs);
    }
    for (const ts of [...stops].sort((a, b) => a - b)) {
      const kg = projection.projectAt(new Date(ts));
      if (kg != null) projected.push({ ts, projectedKg: kg });
    }
  }

  const data = [...history, ...projected].sort((a, b) => a.ts - b.ts);
  const xDomain = timeDomain(data.map((d) => d.ts));
  const values = data
    .flatMap((d) => [d.avgWeightKg, d.projectedKg])
    .filter((v): v is number => v != null);
  if (projection.targetWeightKg != null) values.push(projection.targetWeightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.1, 10);
  const domain = [
    Math.max(0, Math.floor((min - pad) / 10) * 10),
    Math.ceil((max + pad) / 10) * 10,
  ];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <ComposedChart data={data} margin={{ top: 16, right: 24, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={xDomain}
          ticks={timeTicks(xDomain)}
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
        {projection.targetWeightKg != null && (
          <ReferenceLine
            y={projection.targetWeightKg}
            stroke="var(--warning)"
            strokeDasharray="4 4"
            label={{
              value: `Meta ${projection.targetWeightKg.toLocaleString("pt-BR")} kg`,
              position: "insideTopLeft",
              fill: "var(--warning)",
              fontSize: 12,
            }}
          />
        )}
        {targetTs != null && (
          <ReferenceLine
            x={targetTs}
            stroke="var(--warning)"
            strokeDasharray="4 4"
          />
        )}
        <ReferenceLine
          x={today.getTime()}
          stroke="var(--border)"
          label={{
            value: "Hoje",
            position: "insideTopRight",
            fill: "var(--muted-foreground)",
            fontSize: 12,
          }}
        />
        <ChartTooltip
          cursor={{ strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) =>
                new Date(payload?.[0]?.payload?.ts).toLocaleDateString("pt-BR")
              }
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {name === "projectedKg" ? "Projeção" : "Peso médio"}
                    {name === "avgWeightKg" && item.payload.animalCount
                      ? ` (${item.payload.animalCount} animais)`
                      : ""}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {Number(value).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="avgWeightKg"
          type="linear"
          stroke="var(--color-avgWeightKg)"
          strokeWidth={2}
          connectNulls
          dot={{
            r: 3,
            fill: "var(--color-avgWeightKg)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
          isAnimationActive={false}
        />
        <Line
          dataKey="projectedKg"
          type="linear"
          stroke="var(--color-projectedKg)"
          strokeWidth={2}
          strokeDasharray="6 4"
          connectNulls
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
