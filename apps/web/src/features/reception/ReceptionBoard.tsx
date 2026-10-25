import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft, CircleCheckBig, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import {
  SessionStatusBadge,
  formatSessionDateTime,
} from "@/features/management-session/display";
import { managementSessionClient } from "@/lib/clients";
import {
  isNotFoundError,
  isSessionOpen,
  type SessionParticipant,
  nowDateTime,
} from "@ifarm/shared";
import { managementSessionDetailQuery } from "@/features/management-session/queries";
import {
  ParticipantTabs,
  SessionDateDialog,
  UnavailableNotice,
  groupParticipants,
  matchesParticipant,
} from "@/features/management-session/SessionParticipants";
import { ReceptionDocumentsDialog } from "./ReceptionDocumentsDialog";
import { ReceptionPanel } from "./ReceptionPanel";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { useReloadReception } from "./queries";

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
  const navigate = useNavigate();
  const boardPath = `/recepcoes/${id}`;

  const [search, setSearch] = useState("");
  const [dateDialog, setDateDialog] = useState(false);
  const [documentsDialog, setDocumentsDialog] = useState(false);
  const [removing, setRemoving] = useState<SessionParticipant | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const {
    data: detail,
    error,
    isPending,
    refetch,
  } = useQuery(managementSessionDetailQuery(id));

  // Toda alteração na recepção recarrega a sessão e o que ela afeta (compra, animais, lotes).
  const reloadReception = useReloadReception();

  const changeDate = useMutation({
    mutationFn: (date: string) =>
      managementSessionClient.startManagementSession(id, date),
    onSuccess: () => {
      toast.success("Data da recepção alterada.");
      return reloadReception();
    },
  });
  const removeAnimal = useMutation({
    mutationFn: (animalId: string) =>
      managementSessionClient.removeParticipant(id, animalId),
    onSuccess: () => {
      toast.success("Recebimento desfeito.");
      return reloadReception();
    },
    onError: (e) => toast.error(e.message),
  });
  const confirmReception = useMutation({
    mutationFn: () => managementSessionClient.confirmManagementSession(id),
    onSuccess: (result) => {
      toast.success(
        `Recepção concluída: ${result.data.handled} animal(is) recebido(s).`,
      );
      return reloadReception();
    },
    onError: (e) => toast.error(e.message),
  });
  const cancelReception = useMutation({
    mutationFn: () => managementSessionClient.cancelManagementSession(id),
    onError: (e) => toast.error(e.message),
  });

  if (isPending) return <ListSkeleton columns={4} />;

  if (!detail) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Recepção não encontrada"
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

  const reception = detail.reception;
  if (!reception) {
    return (
      <ErrorPage
        message="Esta sessão não é uma recepção de compra."
        onRetry={() => navigate("/recepcoes")}
      />
    );
  }

  const { status, steps } = detail;
  const inProgress = status === "in_progress";
  const editable = isSessionOpen(status);
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
  const hasUnavailable = detail.participants.some(
    (p) => p.animal.unavailableReason,
  );

  function openAnimal(animalId: string) {
    navigate(`${boardPath}/${animalId}`);
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
    if (target?.animal.unavailableReason)
      toast.warning(
        `Animal ${target.animal.unavailableReason.toLowerCase()}: remova-o da recepção.`,
      );
    else if (target) openAnimal(target.animal.id);
    else if (!filtered.length)
      toast.warning("Nenhum animal da recepção encontrado.");
  }

  // O diálogo de data espera a promessa: fecha no sucesso e continua aberto na falha.
  async function handleDate(date: string) {
    try {
      await changeDate.mutateAsync(date);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  function handleRemove() {
    if (removing) removeAnimal.mutate(removing.animal.id);
    setRemoving(null);
  }

  function handleConfirm() {
    setConfirming(false);
    confirmReception.mutate();
  }

  // Cancelada, a recepção sai da tela: volta para a compra antes de recarregar.
  function handleCancel() {
    setCancelling(false);
    cancelReception.mutate(undefined, {
      onSuccess: () => {
        toast.success("Recepção cancelada.");
        navigate(purchaseUrl);
        reloadReception();
      },
    });
  }
  const consolidating = confirmReception.isPending;

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
        onClick={() => navigate(purchaseUrl)}
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
              disabled={consolidating || hasUnavailable || counts.total === 0}
              title={
                hasUnavailable
                  ? "Remova os animais que não estão mais ativos para concluir."
                  : undefined
              }
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
        {detail.performedAt && (
          <span className="flex items-center gap-1">
            Data da recepção:{" "}
            <span className="font-medium text-foreground">
              {formatSessionDateTime(detail.performedAt)}
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

      <UnavailableNotice participants={detail.participants} action="concluir" />

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
        initial={detail.performedAt ?? nowDateTime()}
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
