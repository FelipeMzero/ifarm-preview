import { useQuery } from "@tanstack/react-query";
import { Fence, LandPlot, MapPin, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { currentPropertyDetailsQuery } from "@/features/shell/queries";
import { NoPropertySelected } from "@/features/shell/NoPropertySelected";
import { dashboardQuery } from "./queries";
import { DashboardKpis } from "./DashboardKpis";
import { PastureStatusChart } from "./PastureStatusChart";
import { CategoryDistributionChart } from "./CategoryDistributionChart";
import { WeightEvolutionChart } from "./WeightEvolutionChart";
import { ReadyPasturesTable } from "./ReadyPasturesTable";
import { SlaughterProjectionsTable } from "./SlaughterProjectionsTable";

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function Dashboard() {
  const { property: currentProperty, isLoading: isCurrentPropertyLoading } =
    useCurrentProperty();

  const {
    data: property,
    isPending: isPropertyPending,
    isError: isPropertyError,
    refetch: refetchProperty,
  } = useQuery({
    ...currentPropertyDetailsQuery(currentProperty?.id),
    enabled: !isCurrentPropertyLoading && !!currentProperty?.id,
  });

  const {
    data: dashboardData,
    isPending: isDashboardPending,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    ...dashboardQuery(currentProperty?.id),
    enabled: !isCurrentPropertyLoading && !!currentProperty?.id,
  });

  if (isCurrentPropertyLoading || isPropertyPending || isDashboardPending) {
    return <DashboardSkeleton />;
  }

  if ((isPropertyError && !property) || (isDashboardError && !dashboardData)) {
    return (
      <ErrorPage
        message="Não foi possível obter as informações do painel."
        onRetry={() => {
          refetchProperty();
          refetchDashboard();
        }}
      />
    );
  }

  if (!property || !dashboardData) {
    return <NoPropertySelected />;
  }

  const location = [property.city, property.state].filter(Boolean).join("/");

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da fazenda em tempo real
          </p>
        </div>
      </div>

      {/* Identificação da Propriedade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar size="lg">
              <AvatarFallback>
                <Fence className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-semibold">{property.name}</h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3.5" /> Titular: {property.ownerName}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <LandPlot className="size-4" /> Informações Territoriais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Área Total</p>
              <p className="font-medium">
                {property.totalArea ? `${property.totalArea} ha` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Área Produtiva</p>
              <p className="font-medium">
                {property.productiveArea
                  ? `${property.productiveArea} ha`
                  : "—"}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> Localização
              </p>
              <p className="font-medium">{location || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Principais */}
      <DashboardKpis
        summary={dashboardData.summary}
        pastureStatus={dashboardData.pastureStatus}
      />

      {/* Gráficos de Pastagens e Categorias */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PastureStatusChart data={dashboardData.pastureStatus} />
        <CategoryDistributionChart data={dashboardData.categoryDistribution} />
      </div>

      {/* Evolução de Peso Médio */}
      <WeightEvolutionChart data={dashboardData.weightEvolution} />

      {/* Tabela de Pastos Prontos para Uso */}
      <ReadyPasturesTable data={dashboardData.readyPastures} />

      {/* Tabela de Projeção de Abate (Predição Linear) */}
      <SlaughterProjectionsTable data={dashboardData.slaughterProjections} />
    </div>
  );
}
