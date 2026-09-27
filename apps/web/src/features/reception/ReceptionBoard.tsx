"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheckBig, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import ListSkeleton from "@/components/our/ListSkeleton";
import {
  SessionStatusBadge,
  formatSessionDate,
  todayIso,
} from "@/features/management-session/display";
import {
  cancelManagementSession,
  confirmManagementSession,
  getManagementSession,
  removeParticipant,
  startManagementSession,
  type ManagementSessionDetail,
  type SessionParticipant,
} from "@/features/management-session/services";
import {
  ParticipantTabs,
  SessionDateDialog,
  groupParticipants,
  matchesParticipant,
} from "@/features/management-session/SessionParticipants";
import { ReceptionDocumentsDialog } from "./ReceptionDocumentsDialog";
import { ReceptionPanel } from "./ReceptionPanel";

const TAB_LABELS = {
  pending: "A manejar",
  partial: "Parciais",
  done: "Completos",
};

const EMPTY_MESSAGES = {
  pending: "Todos os animais recebidos já passaram pelos manejos.",
  partial: "Nenhum animal com manejo parcial.",
  done: "Nenhum animal com todos os manejos registrados.",
  none: "Nenhum animal recebido ainda.",
};

// Recepção de uma compra: os animais são cadastrados conforme descem do caminhão e
// passam pelos manejos de chegada. Por baixo é uma sessão de manejo; as telas de cada
// etapa são as mesmas do registro de manejo.
export function ReceptionBoard({ id }: { id: string }) {
  const router = useRouter();
  const boardPath = `/recepcoes/${id}`;

  const [detail, setDetail] = useState<ManagementSessionDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [dateDialog, setDateDialog] = useState(false);
  const [documentsDialog, setDocumentsDialog] = useState(false);
  const [removing, setRemoving] = useState<SessionParticipant | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const reload = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    getManagementSession(id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!detail) return <ListSkeleton columns={4} />;

  const reception = detail.reception;
  if (!reception) {
    return (
      <ErrorPage
        message="Esta sessão não é uma recepção de compra."
        onRetry={() => router.push("/recepcoes")}
      />
    );
  }

  const { status, steps } = detail;
  const inProgress = status === "in_progress";
  const editable = status === "planned" || inProgress;
  const hasSteps = steps.length > 0;
  const purchaseUrl = `/recepcoes/compras/${reception.purchaseEventId}`;

  const categoryLabels = new Map(
    reception.categories.map((c) => [c.id, c.label]),
  );

  const filtered = detail.participants.filter((p) =>
    matchesParticipant(p, search),
  );
  const pending = groupParticipants(filtered).pending;

  const counts = {
    total: detail.participants.length,
    done: detail.participants.filter((p) => p.status === "done").length,
    partial: detail.participants.filter((p) => p.status === "partial").length,
  };
  const withPending = counts.total - counts.done;

  function openAnimal(animalId: string) {
    router.push(`${boardPath}/${animalId}`);
  }

  // Enter na busca com um único animal "a manejar" (ou um único resultado) já abre o
  // registro dele — prático com leitor de RFID/brinco que digita e envia Enter.
  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !hasSteps) return;
    e.preventDefault();
    const target =
      pending.length === 1
        ? pending[0]
        : filtered.length === 1
          ? filtered[0]
          : null;
    if (target) openAnimal(target.animal.id);
    else if (!filtered.length)
      toast.warning("Nenhum animal da recepção encontrado.");
  }

  async function handleDate(date: string) {
    try {
      await startManagementSession(id, date);
      toast.success("Data da recepção alterada.");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  async function handleRemove() {
    if (!removing) return;
    const target = removing;
    setRemoving(null);
    try {
      await removeParticipant(id, target.animal.id);
      toast.success("Recebimento desfeito.");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleConfirm() {
    setConfirming(false);
    setConsolidating(true);
    try {
      const result = await confirmManagementSession(id);
      toast.success(
        `Recepção concluída: ${result.data.handled} animal(is) recebido(s).`,
      );
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConsolidating(false);
    }
  }

  async function handleCancel() {
    setCancelling(false);
    try {
      await cancelManagementSession(id);
      toast.success("Recepção cancelada.");
      router.push(purchaseUrl);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const confirmDescription = [
    `${counts.total} animal(is) recebido(s) nesta recepção.`,
    hasSteps && withPending
      ? `${withPending} animal(is) com manejos pendentes: só o que foi registrado será aplicado; nenhum animal recebido sai da recepção.`
      : null,
    "Após concluir, os registros passam a valer e a recepção não pode mais ser alterada.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => router.push(purchaseUrl)}
      >
        <ArrowLeft className="size-4" /> {reception.purchaseTitle}
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{detail.title}</h1>
        <SessionStatusBadge status={status} />
        <div className="ml-auto flex gap-2">
          {editable && counts.total === 0 && (
            <Button
              variant="outline"
              className="w-auto"
              onClick={() => setCancelling(true)}
            >
              <X className="size-4" /> Cancelar recepção
            </Button>
          )}
          {inProgress && (
            <Button
              className="w-auto"
              onClick={() => setConfirming(true)}
              disabled={consolidating || counts.total === 0}
            >
              {consolidating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CircleCheckBig className="size-4" />
              )}
              Concluir recepção
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {detail.managementDate && (
          <span className="flex items-center gap-1">
            Data da recepção:{" "}
            <span className="font-medium text-foreground">
              {formatSessionDate(detail.managementDate)}
            </span>
            {inProgress && (
              <Button
                variant="link"
                size="sm"
                className="h-auto px-1"
                onClick={() => setDateDialog(true)}
              >
                alterar
              </Button>
            )}
          </span>
        )}
        <span className="flex items-center gap-1">
          GTA:{" "}
          <span className="text-foreground">{reception.gtaNumber ?? "—"}</span>
          {" · "}NF:{" "}
          <span className="text-foreground">
            {reception.invoiceNumber ?? "—"}
          </span>
          {editable && (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-1"
              onClick={() => setDocumentsDialog(true)}
            >
              {reception.gtaNumber || reception.invoiceNumber
                ? "alterar"
                : "informar"}
            </Button>
          )}
        </span>
        <span>
          Manejos:{" "}
          <span className="text-foreground">
            {hasSteps
              ? steps.map((s) => s.label).join(" → ")
              : "nenhum (só o cadastro)"}
          </span>
        </span>
      </div>
      <Separator />

      <ReceptionPanel
        sessionId={id}
        reception={reception}
        canReceive={inProgress}
        hasSteps={hasSteps}
        onReceived={(animalId, openSteps) => {
          if (openSteps) openAnimal(animalId);
          else reload();
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              hasSteps
                ? "Brinco, RFID, ID ou apelido (Enter abre o animal)..."
                : "Brinco, RFID, ID ou apelido..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            className="h-11 pl-8"
          />
        </div>
      </div>

      <ParticipantTabs
        participants={detail.participants}
        steps={steps}
        search={search}
        editable={editable}
        labels={{
          ...TAB_LABELS,
          pending: editable ? TAB_LABELS.pending : "Não manejados",
        }}
        emptyMessages={EMPTY_MESSAGES}
        tagOf={(p) =>
          p.categoryId != null ? categoryLabels.get(p.categoryId) : undefined
        }
        removeTitle="Desfazer o recebimento"
        onOpen={(p) => openAnimal(p.animal.id)}
        onRemove={setRemoving}
      />

      <SessionDateDialog
        open={dateDialog}
        initial={detail.managementDate ?? todayIso()}
        title="Data da recepção"
        description="Data em que os animais chegaram. Todos os registros da recepção recebem esta data."
        confirmLabel="Salvar"
        onOpenChange={setDateDialog}
        onConfirm={handleDate}
      />

      <ReceptionDocumentsDialog
        sessionId={id}
        initial={{
          gtaNumber: reception.gtaNumber,
          invoiceNumber: reception.invoiceNumber,
        }}
        open={documentsDialog}
        onOpenChange={setDocumentsDialog}
        onSaved={reload}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        onConfirm={handleRemove}
        title="Desfazer recebimento"
        description="O animal é apagado: cadastro, entrada no lote e registros desta recepção."
        confirmLabel="Desfazer"
        cancelLabel="Voltar"
      />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={handleConfirm}
        variant="default"
        title="Concluir recepção"
        description={confirmDescription}
        confirmLabel="Concluir"
        cancelLabel="Voltar"
      />

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        onConfirm={handleCancel}
        title="Cancelar recepção"
        description="Nenhum animal foi recebido. A recepção será cancelada e continuará visível na compra."
        confirmLabel="Cancelar recepção"
        cancelLabel="Voltar"
      />
    </div>
  );
}
