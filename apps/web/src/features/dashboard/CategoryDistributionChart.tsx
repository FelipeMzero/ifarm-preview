import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Layers } from "lucide-react";
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
import type { DashboardCategoryItem } from "@ifarm/shared";

type CategoryDistributionChartProps = {
  data: DashboardCategoryItem[];
};

const chartConfig = {
  count: {
    label: "Quantidade",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export function CategoryDistributionChart({
  data,
}: CategoryDistributionChartProps) {
  const safeData = data ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Layers className="size-4 text-amber-600 dark:text-amber-400" />
          Animais por Categoria
        </CardTitle>
        <CardDescription>
          Distribuição por faixa etária, sexo e castração
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center p-4">
        {safeData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Sem dados de categoria disponíveis.
          </div>
        ) : (
          <div className="w-full">
            <ChartContainer
              config={chartConfig}
              className="mx-auto max-h-[220px] w-full"
            >
              <BarChart
                data={safeData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(val, _name, item) => (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{val} animais</span>
                          <span className="text-muted-foreground">
                            ({item.payload.percentage}%)
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
