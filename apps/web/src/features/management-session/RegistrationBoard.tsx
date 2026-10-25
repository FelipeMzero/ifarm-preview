import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheckBig,
  ClipboardList,
  Loader2,
  Play,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { AnimalPicker } from "@/features/batch-transfer/AnimalPicker";
import {
  isNotFoundError,
  isSessionOpen,
  type TransferAnimal,
  nowDateTime,
} from "@ifarm/shared";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import type { ParticipantStatus } from "@ifarm/shared";
import { SessionStatusBadge, formatSessionDateTime } from "./display";
import { managementSessionClient } from "@/lib/clients";
import { type SessionParticipant } from "@ifarm/shared";
import { managementSessionDetailQuery, useReloadSessions } from "./queries";
import {
  ParticipantTabs,
  SessionDateDialog,
  UnavailableNotice,
  groupParticipants,
  matchesParticipant,
} from "./SessionParticipants";
import { ListSkeleton } from "@/components/our/PageSkeletons";

const TAB_LABELS: Record<ParticipantStatus, string> = {
  pending: "A manejar",
  partial: "Parciais",
  done: "Completos",
};

const EMPTY_MESSAGES = {
  pending: "Todos os animais já passaram pelo manejo.",
  partial: "Nenhum animal com manejo parcial.",
  done: "Nenhum animal com todos os manejos registrados.",
  none: "Nenhum animal na sessão.",
};

export function RegistrationBoard({ id }: { id: string }) {
  const navigate = useNavigate();
  const { property: currentProperty } = useCurrentProperty();

  const [search, setSearch] = useState("");
  const [dateDialog, setDateDialog] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removing, setRemoving] = useState<SessionParticipant | null>(null);
  const [confirming, setConfirming] = useState(false);

  const {
    data: detail,
    error,
    isPending,
    refetch,
  } = useQuery(managementSessionDetailQuery(id));

  // Toda alteração recarrega a sessão e o que ela afeta (animais e lotes).
  const reloadSessions = useReloadSessions();
  const startSession = useMutation({
    mutationFn: (date: string) =>
      managementSessionClient.startManagementSession(id, date),
    onSuccess: reloadSessions,
  });
  const addAnimals = useMutation({
    mutationFn: (animalIds: string[]) =>
      managementSessionClient.addParticipants(id, animalIds),
    onSuccess: (result) => {
      toast.success(`${result.data.added} animal(is) incluído(s) na sessão.`);
      return reloadSessions();
    },
    onError: (e) => toast.error(e.message),
  });
  const removeAnimal = useMutation({
    mutationFn: (animalId: string) =>
      managementSessionClient.removeParticipant(id, animalId),
    onSuccess: () => {
      toast.success("Animal removido da sessão.");
      return reloadSessions();
    },
    onError: (e) => toast.error(e.message),
  });
  const confirmSession = useMutation({
    mutationFn: () => managementSessionClient.confirmManagementSession(id),
    onSuccess: (result) => {
      toast.success(
        `Manejo consolidado: ${result.data.handled} animal(is) manejado(s)${
          result.data.removed
            ? `, ${result.data.removed} removido(s) da sessão`
            : ""
        }.`,
      );
      return reloadSessions();
    },
    onError: (e) => toast.error(e.message),
  });
  const consolidating = confirmSession.isPending;

  const participantIds = useMemo(
    () => new Set(detail?.participants.map((p) => p.animal.id) ?? []),
    [detail],
  );

  if (isPending) return <ListSkeleton columns={4} />;

  if (!detail) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Sessão de manejo não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/manejos")}
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

  const { status, steps } = detail;
  const inProgress = status === "in_progress";
  const editable = isSessionOpen(status);

  const filtered = detail.participants.filter((p) =>
    matchesParticipant(p, search),
  );
  const pending = groupParticipants(filtered).pending;

  const counts = {
    total: detail.participants.length,
    done: detail.participants.filter((p) => p.status === "done").length,
    partial: detail.participants.filter((p) => p.status === "partial").length,
  };
  const notHandled = counts.total - counts.done - counts.partial;
  const hasUnavailable = detail.participants.some(
    (p) => p.animal.unavailableReason,
  );
  const progress = counts.total
    ? ((counts.done + counts.partial) / counts.total) * 100
    : 0;

  // O registro começa com a data de hoje; se precisar, ela é corrigida no cabeçalho.
  async function startToday(animalId?: string) {
    try {
      await startSession.mutateAsync(nowDateTime());
      toast.success("Registro iniciado com a data de hoje.");
      if (animalId) navigate(`/manejos/${id}/registro/${animalId}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function openAnimal(animalId: string) {
    if (status === "planned") {
      startToday(animalId);
      return;
    }
    navigate(`/manejos/${id}/registro/${animalId}`);
  }

  // Enter na busca com um único animal "a manejar" (ou um único resultado) já abre o
  // registro dele — prático com leitor de RFID/brinco que digita e envia Enter.
  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const target =
      pending.length === 1
        ? pending[0]
        : filtered.length === 1
          ? filtered[0]
          : null;
    if (target?.animal.unavailableReason)
      toast.warning(
        `Animal ${target.animal.unavailableReason.toLowerCase()}: remova-o da sessão.`,
      );
    else if (target) openAnimal(target.animal.id);
    else if (!filtered.length)
      toast.warning("Nenhum animal da sessão encontrado.");
  }

  // O diálogo de data espera a promessa: fecha no sucesso e continua aberto na falha.
  async function handleStart(date: string) {
    try {
      await startSession.mutateAsync(date);
      toast.success("Data do manejo alterada.");
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  function handleAdd(animals: TransferAnimal[]) {
    const ids = animals.map((a) => a.id).filter((a) => !participantIds.has(a));
    if (ids.length) addAnimals.mutate(ids);
  }

  function handleRemove() {
    if (removing) removeAnimal.mutate(removing.animal.id);
    setRemoving(null);
  }

  function handleConfirm() {
    setConfirming(false);
    confirmSession.mutate();
  }

  const confirmDescription = [
    `${counts.done} animal(is) com todos os manejos registrados.`,
    counts.partial
      ? `${counts.partial} parcial(is): só os manejos registrados serão aplicados.`
      : null,
    notHandled
      ? `Atenção: ${notHandled} animal(is) não foram manejados e serão removidos da sessão.`
      : null,
    "Após consolidar, os registros passam a valer e a sessão não pode mais ser alterada.",
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
        onClick={() => navigate("/manejos")}
      >
        <ArrowLeft className="size-4" /> Sessões de manejo
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{detail.title}</h1>
        <SessionStatusBadge status={status} />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/manejos/${id}`)}>
            <ClipboardList className="size-4" /> Planejamento
          </Button>
          {inProgress && (
            <Button
              onClick={() => setConfirming(true)}
              disabled={
                consolidating ||
                hasUnavailable ||
                counts.done + counts.partial === 0
              }
              title={
                hasUnavailable
                  ? "Remova os animais que não estão mais ativos para consolidar."
                  : undefined
              }
            >
              {consolidating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CircleCheckBig className="size-4" />
              )}
              Consolidar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          Prevista:{" "}
          <span className="text-foreground">
            {formatSessionDateTime(detail.scheduledAt)}
          </span>
        </span>
        {detail.performedAt && (
          <span className="flex items-center gap-1">
            Data do manejo:{" "}
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
        <span>
          Manejos:{" "}
          <span className="text-foreground">
            {steps.map((s) => s.label).join(" → ")}
          </span>
        </span>
      </div>
      {detail.notes && (
        <p className="text-sm text-muted-foreground">{detail.notes}</p>
      )}
      <Separator />

      {status === "planned" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <CalendarDays className="size-5 text-muted-foreground" />
          <p className="flex-1 text-sm">
            O registro ainda não começou. Ao iniciar, a data do manejo será a de
            hoje (pode ser alterada depois).
          </p>
          <Button onClick={() => startToday()}>
            <Play className="size-4" /> Iniciar registro
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            <span className="font-medium tabular-nums">
              {counts.done + counts.partial}
            </span>{" "}
            de <span className="tabular-nums">{counts.total}</span> animais
            manejados
            {counts.partial > 0 && (
              <span className="text-muted-foreground">
                {" "}
                ({counts.partial} parcial{counts.partial > 1 ? "is" : ""})
              </span>
            )}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Brinco, RFID, ID ou apelido (Enter abre o animal)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            className="h-11 pl-8"
            autoFocus
          />
        </div>
        {editable && (
          <Button
            variant="outline"
            title="Incluir animais na sessão"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" /> Animais
          </Button>
        )}
      </div>

      <UnavailableNotice participants={detail.participants} />

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
        removeTitle="Remover da sessão"
        onOpen={(p) => openAnimal(p.animal.id)}
        onRemove={setRemoving}
      />

      <SessionDateDialog
        open={dateDialog}
        initial={detail.performedAt ?? nowDateTime()}
        title="Data do manejo"
        description="Data em que o manejo está sendo feito. Todos os registros da sessão recebem esta data."
        confirmLabel="Salvar"
        onOpenChange={setDateDialog}
        onConfirm={handleStart}
      />

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Incluir animais</DialogTitle>
            <DialogDescription>
              Animais que não estavam no planejamento. Marque para incluir na
              sessão.
            </DialogDescription>
          </DialogHeader>
          <AnimalPicker
            propertyId={currentProperty?.id}
            destinationBatchId=""
            intent={{
              kind: "session",
              stepKeys: detail?.steps.map((s) => s.key) ?? [],
            }}
            exclude={{ sessionId: id }}
            selectedIds={participantIds}
            onAdd={handleAdd}
            onRemove={() =>
              toast.info("Para remover um animal, use a lista da sessão.")
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        onConfirm={handleRemove}
        title="Remover animal da sessão"
        description={
          removing && removing.status !== "pending"
            ? "Os registros já feitos neste animal serão desfeitos."
            : "O animal deixará de participar desta sessão."
        }
        confirmLabel="Remover"
        cancelLabel="Voltar"
      />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={handleConfirm}
        variant="default"
        title="Consolidar manejo"
        description={confirmDescription}
        confirmLabel="Consolidar"
        cancelLabel="Voltar"
      />
    </div>
  );
}
