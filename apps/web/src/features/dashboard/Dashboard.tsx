import { useEffect, useState } from "react";
import { Link } from "react-router";
import { LandPlot, MapPin, Fence, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { currentPropertyClient } from "@/lib/clients";
import { type CurrentPropertyDetails } from "@ifarm/shared";

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
  const {
    property: currentProperty,
    options: propertyOptions,
    isLoading: isCurrentPropertyLoading,
  } = useCurrentProperty();
  const [property, setProperty] = useState<CurrentPropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCurrentPropertyLoading) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await currentPropertyClient.getCurrentPropertyDetails();
        if (!cancelled) setProperty(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // Refaz a busca sempre que a propriedade selecionada mudar (trocada no seletor da sidebar).
  }, [currentProperty?.id, isCurrentPropertyLoading]);

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados da propriedade."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!property) {
    if (propertyOptions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Fence className="size-8" />
          <p>Nenhuma propriedade cadastrada ainda.</p>
          <Button asChild size="sm">
            <Link to="/propriedades/novo">Cadastrar propriedade</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <Fence className="size-8" />
        <p>Nenhuma propriedade selecionada.</p>
        <p className="text-sm">
          Escolha uma propriedade no menu lateral para continuar.
        </p>
      </div>
    );
  }

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
