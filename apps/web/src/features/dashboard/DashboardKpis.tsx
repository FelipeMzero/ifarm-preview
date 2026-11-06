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

function MarsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4" />
      <path d="M19 5h-5" />
      <path d="M19 5v5" />
    </svg>
  );
}

function VenusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7" />
      <path d="M9 18h6" />
    </svg>
  );
}

type DashboardKpisProps = {
  summary?: DashboardSummary;
  pastureStatus?: DashboardPastureStatus;
};

export function DashboardKpis({ summary, pastureStatus }: DashboardKpisProps) {
  const stockingRate = summary?.stockingRate ?? {
    uaPerHa: null,
    totalUa: 0,
    totalProductiveHectares: 0,
  };
  const totalAnimals = summary?.totalAnimals ?? 0;
  const males = summary?.males ?? 0;
  const females = summary?.females ?? 0;
  const activeBatches = summary?.activeBatches ?? 0;
  const averageWeightKg = summary?.averageWeightKg ?? null;
  const averageAdg = summary?.averageAdg ?? null;
  const availablePastures = pastureStatus?.available ?? 0;

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
            {totalAnimals}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MarsIcon className="size-3 text-sky-500" />
              <span>{males} machos</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <VenusIcon className="size-3 text-rose-500" />
              <span>{females} fêmeas</span>
            </span>
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
            {activeBatches}
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
            {averageWeightKg != null ? `${averageWeightKg} kg` : "—"}
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
            {averageAdg != null ? `${averageAdg}` : "—"}
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
            {availablePastures}
          </div>
          <div className="text-xs text-muted-foreground">Descanso cumprido</div>
        </CardContent>
      </Card>
    </div>
  );
}
