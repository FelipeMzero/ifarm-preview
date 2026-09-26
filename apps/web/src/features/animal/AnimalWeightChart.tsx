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

const formatFullDate = (ts: number) => new Date(ts).toLocaleDateString("pt-BR");

// Idade em meses completos na data (null se anterior ao nascimento).
function ageInMonths(birth: Date, ts: number) {
  const d = new Date(ts);
  let months =
    (d.getFullYear() - birth.getFullYear()) * 12 +
    (d.getMonth() - birth.getMonth());
  if (d.getDate() < birth.getDate()) months--;
  return months < 0 ? null : months;
}

function formatAge(months: number, estimated: boolean) {
  const label =
    months === 0 ? "< 1 mês" : `${months} ${months === 1 ? "mês" : "meses"}`;
  // Nascimento estimado (ex.: idade informada na compra): idade aproximada.
  return estimated ? `~${label}` : label;
}

// Rótulo do eixo em duas linhas: data e, abaixo, a idade do animal naquela data.
function DateAgeTick({
  x,
  y,
  payload,
  ageLabel,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  ageLabel: (ts: number) => string | null;
}) {
  if (payload == null) return null;
  const age = ageLabel(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={10} textAnchor="middle" className="fill-muted-foreground">
        {formatShortDate(payload.value)}
      </text>
      {age && (
        <text
          dy={25}
          textAnchor="middle"
          className="fill-muted-foreground/70 text-[11px]"
        >
          {age}
        </text>
      )}
    </g>
  );
}

export function AnimalWeightChart({
  weighings,
  birthDate,
  birthDateEstimated = false,
}: {
  weighings: AnimalWeighing[];
  /** yyyy-mm-dd; com ela, o eixo e o tooltip mostram a idade em cada data. */
  birthDate?: string | null;
  birthDateEstimated?: boolean;
}) {
  const data = weighings.map((w) => ({
    ts: new Date(w.date).getTime(),
    weightKg: w.weightKg,
  }));

  const birth = birthDate ? new Date(`${birthDate}T00:00:00`) : null;
  const ageLabel = (ts: number) => {
    const months = birth ? ageInMonths(birth, ts) : null;
    return months == null ? null : formatAge(months, birthDateEstimated);
  };

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
          tick={
            birth ? (
              <DateAgeTick ageLabel={ageLabel} />
            ) : (
              { className: "fill-muted-foreground" }
            )
          }
          tickFormatter={formatShortDate}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          // Espaço para a segunda linha (idade) do rótulo.
          height={birth ? 44 : 30}
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
              // "dot": com uma série só, "line" aninha o rótulo no item, e o formatter
              // abaixo substitui o item (a data sumia do tooltip).
              indicator="dot"
              labelFormatter={(_, payload) => {
                const ts = payload?.[0]?.payload?.ts;
                const age = ts != null ? ageLabel(ts) : null;
                return age
                  ? `${formatFullDate(ts)} · ${age}`
                  : formatFullDate(ts);
              }}
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
