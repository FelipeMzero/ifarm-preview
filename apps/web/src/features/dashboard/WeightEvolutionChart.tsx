import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardWeightEvolutionItem } from "@ifarm/shared";

type WeightEvolutionChartProps = {
  data: DashboardWeightEvolutionItem[];
};

const chartConfig = {
  averageWeightKg: {
    label: "Peso Médio",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function WeightEvolutionChart({ data }: WeightEvolutionChartProps) {
  const safeData = data ?? [];
  const hasData = safeData.some((d) => d.averageWeightKg > 0);
  const weights = safeData
    .filter((d) => d.averageWeightKg > 0)
    .map((d) => d.averageWeightKg);
  const minWeight = weights.length ? Math.min(...weights) : 0;
  const maxWeight = weights.length ? Math.max(...weights) : 500;
  const yMin = Math.max(0, Math.floor((minWeight - 20) / 10) * 10);
  const yMax = Math.ceil((maxWeight + 20) / 10) * 10;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          Evolução do Peso Médio — Últimos 6 Meses
        </CardTitle>
        <CardDescription>
          Média mensal dos pesos registrados nas pesagens válidas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {!hasData ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma pesagem realizada nos últimos 6 meses.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <AreaChart
              data={safeData}
              margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="fillAvgWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v: number) => `${v} kg`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(val, _name, item) => (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-semibold">{val} kg</span>
                        <span className="text-muted-foreground">
                          {item.payload.animalCount} pesagens no mês
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="averageWeightKg"
                type="monotone"
                fill="url(#fillAvgWeight)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
