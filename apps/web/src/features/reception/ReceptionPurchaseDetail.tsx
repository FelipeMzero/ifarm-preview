import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ErrorPage } from "@/components/our/ErrorPage";
import { ReceivedCount, formatDay } from "@/features/purchase/display";
import { SessionStatusBadge } from "@/features/management-session/display";
import { NewReceptionDialog } from "./NewReceptionDialog";
import { isNotFoundError } from "@ifarm/shared";
import { FormSkeleton } from "@/components/our/PageSkeletons";
import { receptionPurchaseQuery } from "./queries";

// A compra vista por quem recebe: o que foi negociado (em quantidade), o que já
// chegou e as recepções. Daqui se abre uma nova recepção.
export function ReceptionPurchaseDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: purchase,
    error,
    isPending,
    refetch,
  } = useQuery(receptionPurchaseQuery(id));

  if (isPending) return <FormSkeleton />;

  if (!purchase) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Compra não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/recepcoes")}
          backLabel="Voltar"
        />
      );
    }
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => navigate("/recepcoes")}
      >
        <ArrowLeft className="size-4" /> Recepções
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{purchase.title}</h1>
          <p className="text-sm text-muted-foreground">
            {purchase.seller.name}
          </p>
        </div>
        {purchase.status === "cancelled" && (
          <Badge variant="secondary">Cancelada</Badge>
        )}
        {purchase.status === "confirmed" && <Badge>Consolidada</Badge>}
        {purchase.status === "open" && (
          <Button
            className="ml-auto w-auto"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" /> Recepção
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          Data da compra:{" "}
          <span className="text-foreground">
            {formatDay(purchase.purchaseDate)}
          </span>
        </span>
        <span>
          Recebidos:{" "}
          <ReceivedCount
            received={purchase.receivedQuantity}
            expected={purchase.expectedQuantity}
          />
        </span>
      </div>
      {purchase.notes && (
        <p className="text-sm text-muted-foreground">{purchase.notes}</p>
      )}
      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">
          Categorias negociadas
        </h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {purchase.categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
            >
              <span>{c.label}</span>
              <ReceivedCount
                received={c.receivedQuantity}
                expected={c.expectedQuantity}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">
          Recepções ({purchase.receptions.length})
        </h3>
        {purchase.receptions.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Nenhum animal recebido ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {purchase.receptions.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/recepcoes/${r.sessionId}`)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{r.title}</span>
                  <SessionStatusBadge status={r.status} />
                  <span className="text-muted-foreground">
                    {formatDay(r.performedAt ?? r.scheduledAt)}
                  </span>
                  <span className="text-muted-foreground">
                    Lote de entrada: {r.entryBatch.name}
                  </span>
                  {(r.gtaNumber || r.invoiceNumber) && (
                    <span className="text-muted-foreground">
                      {[
                        r.gtaNumber && `GTA ${r.gtaNumber}`,
                        r.invoiceNumber && `NF ${r.invoiceNumber}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums">
                    {r.animalCount} animal(is)
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewReceptionDialog
        purchaseId={purchase.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(sessionId) => navigate(`/recepcoes/${sessionId}`)}
      />
    </div>
  );
}
