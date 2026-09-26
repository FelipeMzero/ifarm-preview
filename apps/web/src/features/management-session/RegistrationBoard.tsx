"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Loader2,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import ListSkeleton from "@/components/our/ListSkeleton";
import { Pagination } from "@/components/our/Pagination";
import { AnimalIdentification, SEX_ICON } from "@/features/animal/display";
import { AnimalPicker } from "@/features/batch-transfer/AnimalPicker";
import type { TransferAnimal } from "@/features/batch-transfer/services";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import type { ParticipantStatus } from "@/lib/management-steps";
import {
  ParticipantStatusBadge,
  SessionStatusBadge,
  STEP_ICONS,
  formatSessionDate,
  todayIso,
} from "./display";
import {
  addParticipants,
  confirmManagementSession,
  getManagementSession,
  removeParticipant,
  startManagementSession,
  type ManagementSessionDetail,
  type SessionParticipant,
  type SessionStepView,
} from "./services";

// Com centenas de animais a lista fica longa: uma aba por situação, paginada.
const PAGE_SIZE = 10;

const TABS: ParticipantStatus[] = ["pending", "partial", "done"];

const TAB_LABELS: Record<ParticipantStatus, string> = {
  pending: "A manejar",
  partial: "Parciais",
  done: "Completos",
};

const EMPTY_MESSAGES: Record<ParticipantStatus, string> = {
  pending: "Todos os animais já passaram pelo manejo.",
  partial: "Nenhum animal com manejo parcial.",
  done: "Nenhum animal com todos os manejos registrados.",
};

function matches(p: SessionParticipant, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { animal } = p;
  return [animal.earTag, animal.rfid, animal.name, String(animal.code)].some(
    (v) => v?.toLowerCase().includes(q),
  );
}

function StepProgress({
  steps,
  doneKeys,
}: {
  steps: SessionStepView[];
  doneKeys: string[];
}) {
  const done = new Set(doneKeys);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step) => {
        const Icon = STEP_ICONS[step.type];
        const ok = done.has(step.key);
        return (
          <span
            key={step.key}
            title={`${step.label}${ok ? " — registrado" : ""}`}
            className={cn(
              "flex size-6 items-center justify-center rounded-md border",
              ok
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        );
      })}
    </div>
  );
}

function ParticipantRow({
  participant,
  steps,
  canRemove,
  onOpen,
  onRemove,
}: {
  participant: SessionParticipant;
  steps: SessionStepView[];
  canRemove: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { animal } = participant;
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card pr-2 transition-colors hover:bg-accent/40">
      {/* div em vez de <button>: a identificação do animal já contém um botão (RFID). */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-32">
          <AnimalIdentification animal={animal} />
        </div>
        <span className="shrink-0">{SEX_ICON[animal.sex] ?? animal.sex}</span>
        <span className="max-w-40 truncate text-sm text-muted-foreground">
          {animal.currentBatch?.name ?? "Sem lote"}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {animal.currentWeightKg != null
            ? `${animal.currentWeightKg} kg`
            : "—"}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {participant.status !== "pending" && (
            <ParticipantStatusBadge status={participant.status} />
          )}
          <StepProgress steps={steps} doneKeys={participant.doneKeys} />
        </span>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Remover da sessão"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </li>
  );
}

type DateDialogProps = {
  open: boolean;
  initial: string;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => Promise<void>;
};

function DateDialog({
  open,
  onOpenChange,
  title,
  description,
  ...rest
}: DateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Montado só com o diálogo aberto: cada abertura começa da data atual. */}
        <DateForm {...rest} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function DateForm({
  initial,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: Pick<
  DateDialogProps,
  "initial" | "confirmLabel" | "onOpenChange" | "onConfirm"
>) {
  const [date, setDate] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirm(date);
      onOpenChange(false);
    } catch {
      // Erro já avisado por onConfirm; o diálogo continua aberto para correção.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        type="date"
        value={date}
        max={todayIso()}
        required
        onChange={(e) => setDate(e.target.value)}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !date}>
          {saving && <Loader2 className="animate-spin" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RegistrationBoard({ id }: { id: string }) {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();

  const [detail, setDetail] = useState<ManagementSessionDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ParticipantStatus>("pending");
  const [page, setPage] = useState(0);
  const [dateDialog, setDateDialog] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removing, setRemoving] = useState<SessionParticipant | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

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

  const participantIds = useMemo(
    () => new Set(detail?.participants.map((p) => p.animal.id) ?? []),
    [detail],
  );

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!detail) return <ListSkeleton columns={4} />;

  const { status, steps } = detail;
  const inProgress = status === "in_progress";
  const editable = status === "planned" || inProgress;

  const filtered = detail.participants.filter((p) => matches(p, search));
  // Parciais e completos: o último registrado primeiro.
  const byRecent = (a: SessionParticipant, b: SessionParticipant) =>
    (b.lastHandledAt ?? "").localeCompare(a.lastHandledAt ?? "");
  const lists: Record<ParticipantStatus, SessionParticipant[]> = {
    pending: filtered.filter((p) => p.status === "pending"),
    partial: filtered.filter((p) => p.status === "partial").sort(byRecent),
    done: filtered.filter((p) => p.status === "done").sort(byRecent),
  };
  const pending = lists.pending;
  const current = lists[tab];
  const pageCount = Math.ceil(current.length / PAGE_SIZE);
  // Remoções ou registros podem encolher a aba; não deixa a página ficar vazia.
  const safePage = Math.min(page, Math.max(pageCount - 1, 0));

  const counts = {
    total: detail.participants.length,
    done: detail.participants.filter((p) => p.status === "done").length,
    partial: detail.participants.filter((p) => p.status === "partial").length,
  };
  const notHandled = counts.total - counts.done - counts.partial;
  const progress = counts.total
    ? ((counts.done + counts.partial) / counts.total) * 100
    : 0;

  // O registro começa com a data de hoje; se precisar, ela é corrigida no cabeçalho.
  async function startToday(animalId?: string) {
    try {
      await startManagementSession(id, todayIso());
      toast.success("Registro iniciado com a data de hoje.");
      if (animalId) router.push(`/manejos/${id}/registro/${animalId}`);
      else reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function openAnimal(animalId: string) {
    if (status === "planned") {
      startToday(animalId);
      return;
    }
    router.push(`/manejos/${id}/registro/${animalId}`);
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
    if (target) openAnimal(target.animal.id);
    else if (!filtered.length)
      toast.warning("Nenhum animal da sessão encontrado.");
  }

  async function handleStart(date: string) {
    try {
      await startManagementSession(id, date);
      toast.success("Data do manejo alterada.");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  async function handleAdd(animals: TransferAnimal[]) {
    const ids = animals.map((a) => a.id).filter((a) => !participantIds.has(a));
    if (!ids.length) return;
    try {
      const result = await addParticipants(id, ids);
      toast.success(`${result.data.added} animal(is) incluído(s) na sessão.`);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    const target = removing;
    setRemoving(null);
    try {
      await removeParticipant(id, target.animal.id);
      toast.success("Animal removido da sessão.");
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
        `Manejo consolidado: ${result.data.handled} animal(is) manejado(s)${
          result.data.removed
            ? `, ${result.data.removed} removido(s) da sessão`
            : ""
        }.`,
      );
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConsolidating(false);
    }
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
        onClick={() => router.push("/manejos")}
      >
        <ArrowLeft className="size-4" /> Sessões de manejo
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{detail.title}</h1>
        <SessionStatusBadge status={status} />
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/manejos/${id}`)}
          >
            <ClipboardList className="size-4" /> Planejamento
          </Button>
          {inProgress && (
            <Button
              onClick={() => setConfirming(true)}
              disabled={consolidating || counts.done + counts.partial === 0}
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
            {formatSessionDate(detail.scheduledDate)}
          </span>
        </span>
        {detail.managementDate && (
          <span className="flex items-center gap-1">
            Data do manejo:{" "}
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as ParticipantStatus);
          setPage(0);
        }}
        className="gap-3"
      >
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "pending" && !editable ? "Não manejados" : TAB_LABELS[t]} (
              {lists[t].length})
            </TabsTrigger>
          ))}
        </TabsList>

        {current.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            {search
              ? "Nenhum animal encontrado nesta aba."
              : !detail.participants.length
                ? "Nenhum animal na sessão."
                : EMPTY_MESSAGES[tab]}
          </div>
        ) : (
          <ul className="space-y-2">
            {current
              .slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
              .map((p) => (
                <ParticipantRow
                  key={p.animal.id}
                  participant={p}
                  steps={steps}
                  canRemove={editable}
                  onOpen={() => openAnimal(p.animal.id)}
                  onRemove={() => setRemoving(p)}
                />
              ))}
          </ul>
        )}

        {current.length > 0 && (
          <Pagination
            pageIndex={safePage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={current.length}
            onPageChange={setPage}
          />
        )}
      </Tabs>

      <DateDialog
        open={dateDialog}
        initial={detail.managementDate ?? todayIso()}
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
