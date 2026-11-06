import { Cell, Pie, PieChart } from "recharts";
import { Trees } from "lucide-react";
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
import type { DashboardPastureStatus } from "@ifarm/shared";

type PastureStatusChartProps = {
  data: DashboardPastureStatus;
};

const chartConfig = {
  available: {
    label: "Disponível",
    color: "#10b981", // Emerald
  },
  occupied: {
    label: "Ocupada",
    color: "#f59e0b", // Amber
  },
  resting: {
    label: "Em Descanso",
    color: "#0284c7", // Sky
  },
} satisfies ChartConfig;

export function PastureStatusChart({ data }: PastureStatusChartProps) {
  const chartData = [
    {
      name: "Disponível",
      key: "available",
      value: data.available,
      fill: "#10b981",
    },
    { name: "Ocupada", key: "occupied", value: data.occupied, fill: "#f59e0b" },
    {
      name: "Em Descanso",
      key: "resting",
      value: data.resting,
      fill: "#0284c7",
    },
  ].filter((item) => item.value > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trees className="size-4 text-emerald-600 dark:text-emerald-400" />
          Status das Pastagens
        </CardTitle>
        <CardDescription>
          Distribuição das áreas por situação de manejo ({data.total} áreas)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center p-4">
        {data.total === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma pastagem cadastrada.
          </div>
        ) : (
          <div className="w-full">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[220px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legenda customizada */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Disponível:</span>
                <span className="font-semibold">{data.available}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Ocupada:</span>
                <span className="font-semibold">{data.occupied}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-sky-600" />
                <span className="text-muted-foreground">Descanso:</span>
                <span className="font-semibold">{data.resting}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
