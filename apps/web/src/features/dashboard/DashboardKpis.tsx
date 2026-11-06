import {
  Beef,
  Layers,
  Scale,
  TrendingUp,
  Gauge,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummary, DashboardPastureStatus } from "@ifarm/shared";

type DashboardKpisProps = {
  summary: DashboardSummary;
  pastureStatus: DashboardPastureStatus;
};

export function DashboardKpis({ summary, pastureStatus }: DashboardKpisProps) {
  const { stockingRate } = summary;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. Total de Animais */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total de Animais</span>
            <Beef className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {summary.totalAnimals}
          </div>
          <div className="text-xs text-muted-foreground">
            {summary.males} ♂ · {summary.females} ♀
          </div>
        </CardContent>
      </Card>

      {/* 2. Lotes Ativos */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Lotes Ativos</span>
            <Layers className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {summary.activeBatches}
          </div>
          <div className="text-xs text-muted-foreground">Grupos de manejo</div>
        </CardContent>
      </Card>

      {/* 3. Peso Médio */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Peso Médio</span>
            <Scale className="size-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
            {summary.averageWeightKg != null
              ? `${summary.averageWeightKg} kg`
              : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Rebanho ativo</div>
        </CardContent>
      </Card>

      {/* 4. GMD Médio */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">GMD Médio</span>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {summary.averageAdg != null ? `${summary.averageAdg}` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">kg/dia (rebanho)</div>
        </CardContent>
      </Card>

      {/* 5. Taxa de Lotação */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Taxa de Lotação</span>
            <Gauge className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stockingRate.uaPerHa != null ? `${stockingRate.uaPerHa}` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {stockingRate.totalUa} UA / {stockingRate.totalProductiveHectares}{" "}
            ha
          </div>
        </CardContent>
      </Card>

      {/* 6. Pastos Prontos */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pastos Prontos</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {pastureStatus.available}
          </div>
          <div className="text-xs text-muted-foreground">Descanso cumprido</div>
        </CardContent>
      </Card>
    </div>
  );
}
