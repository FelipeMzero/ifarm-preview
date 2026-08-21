"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Beef,
  Compass,
  LandPlot,
  MapPin,
  Trash2,
  Tractor,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { deleteProperty, getProperty } from "./services";
import { PropertyFormData } from "./schema";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";

function DetailsSkeleton() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function PropertyDetails({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { refresh: refreshCurrentProperty } = useCurrentProperty();
  const [property, setProperty] = useState<PropertyFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getProperty(id);
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
  }, [id]);

  async function handleDelete() {
    try {
      await deleteProperty(id);
      toast.success("Registro excluído com sucesso!");
      refreshCurrentProperty();
      if (onClose) onClose();
      else router.push("/propriedades");
    } catch (e) {
      toast.error(
        (e as Error).message || "Não foi possível excluir o registro.",
      );
    } finally {
      setConfirmingDelete(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados da propriedade."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading || !property) {
    return <DetailsSkeleton />;
  }

  const address = [
    property.street && property.number
      ? `${property.street}, ${property.number}`
      : property.street,
    property.complement,
    property.neighborhood,
    property.city && property.state
      ? `${property.city}/${property.state}`
      : property.city,
    property.zipCode,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div
        className={
          onClose
            ? "flex items-center justify-end"
            : "flex items-center justify-between"
        }
      >
        {!onClose && (
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>
              <Tractor className="size-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <h1 className="text-xl font-semibold">{property.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5" /> Titular: {property.ownerName || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandPlot className="size-4" /> Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Área Total</p>
              <p>{property.totalArea ? `${property.totalArea} ha` : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Área Produtiva</p>
              <p>
                {property.productiveArea
                  ? `${property.productiveArea} ha`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">CIB</p>
              <p>{property.cib || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CCIR</p>
              <p>{property.ccir || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CAR</p>
              <p>{property.car || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="size-4" /> Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span>{address || "—"}</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Lat: {property.latitude || "—"}</span>
            <span>Long: {property.longitude || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground">
        As seções abaixo dependem dos módulos MOD-LOTE/MOD-ANIMAL, ainda não
        implementados.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beef className="size-4" /> Lotes e Animais Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Badge variant="outline">Sem histórico</Badge>
            <p className="text-sm">
              Não há lotes ou animais vinculados a esta propriedade.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir este registro?"
      />
    </div>
  );
}
