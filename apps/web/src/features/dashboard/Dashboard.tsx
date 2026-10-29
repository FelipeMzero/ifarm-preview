import { useQuery } from "@tanstack/react-query";
import { LandPlot, MapPin, Fence, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { currentPropertyDetailsQuery } from "@/features/shell/queries";
import { NoPropertySelected } from "@/features/shell/NoPropertySelected";

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function Dashboard() {
  const { property: currentProperty, isLoading: isCurrentPropertyLoading } =
    useCurrentProperty();
  // Busca de novo sempre que a propriedade selecionada mudar (trocada no seletor do menu),
  // depois de saber qual é.
  const {
    data: property,
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...currentPropertyDetailsQuery(currentProperty?.id),
    enabled: !isCurrentPropertyLoading,
  });

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError && property === undefined) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados da propriedade."
        onRetry={() => refetch()}
      />
    );
  }

  if (!property) return <NoPropertySelected />;

  const location = [property.city, property.state].filter(Boolean).join("/");

  return (
    <div className="w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Painel</h1>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>
              <Fence className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-semibold">{property.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="size-3.5" /> Titular: {property.ownerName}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandPlot className="size-4" /> Dados da propriedade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Área Total</p>
            <p>{property.totalArea ? `${property.totalArea} ha` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Área Produtiva</p>
            <p>
              {property.productiveArea ? `${property.productiveArea} ha` : "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3.5" /> Localização
            </p>
            <p>{location || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
