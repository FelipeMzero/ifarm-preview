"use client";

import { useState } from "react";
import { ChevronRight, CircleAlert, Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ParticipantStatus } from "@/lib/management-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/our/Pagination";
import {
  AnimalIdentification,
  NewValueMark,
  SEX_ICON,
} from "@/features/animal/display";
import { ParticipantStatusBadge, STEP_ICONS, todayIso } from "./display";
import type {
  SessionParticipant,
  SessionStepView,
  SessionValues,
} from "./services";

// Partes do registro de uma sessão compartilhadas entre o registro de manejo e a
// recepção de compra (que também é uma sessão de manejo por baixo).

// Com centenas de animais a lista fica longa: uma aba por situação, paginada.
const PAGE_SIZE = 10;

const TABS: ParticipantStatus[] = ["pending", "partial", "done"];

// O que está no animal agora: o brinco, o RFID e o peso registrados na sessão, quando
// houver, ou os atuais. Os da sessão ainda não valem fora dela e vão marcados.
export function sessionView(
  animal: {
    code: number;
    earTag: string | null;
    rfid: string | null;
    currentWeightKg: number | null;
  },
  values: SessionValues,
) {
  return {
    identity: {
      code: animal.code,
      earTag: values.earTag ?? animal.earTag,
      rfid: values.rfid ?? animal.rfid,
    },
    fresh: { earTag: values.earTag != null, rfid: values.rfid != null },
    weightKg: values.weightKg ?? animal.currentWeightKg,
    freshWeight: values.weightKg != null,
  };
}

// Encontra pelo identificador atual e também pelo registrado na sessão (o leitor lê o
// brinco que acabou de ser colocado).
export function matchesParticipant(p: SessionParticipant, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { animal, sessionValues } = p;
  return [
    animal.earTag,
    animal.rfid,
    sessionValues.earTag,
    sessionValues.rfid,
    animal.name,
    String(animal.code),
  ].some((v) => v?.toLowerCase().includes(q));
}

// Participantes por situação; parciais e completos com o último registrado primeiro.
export function groupParticipants(list: SessionParticipant[]) {
  const byRecent = (a: SessionParticipant, b: SessionParticipant) =>
    (b.lastHandledAt ?? "").localeCompare(a.lastHandledAt ?? "");
  return {
    pending: list.filter((p) => p.status === "pending"),
    partial: list.filter((p) => p.status === "partial").sort(byRecent),
    done: list.filter((p) => p.status === "done").sort(byRecent),
  } satisfies Record<ParticipantStatus, SessionParticipant[]>;
}

// Aviso acima da lista quando há animais que impedem a consolidação.
export function UnavailableNotice({
  participants,
  action = "consolidar",
}: {
  participants: SessionParticipant[];
  /** Verbo da ação bloqueada (ex.: "concluir", na recepção). */
  action?: string;
}) {
  const count = participants.filter((p) => p.animal.unavailableReason).length;
  if (!count) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {count} animal(is) não estão mais ativos na propriedade e estão destacados
      na lista. Remova-os antes de {action}.
    </div>
  );
}

export function StepProgress({
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
  tag,
  canRemove,
  removeTitle,
  onOpen,
  onRemove,
}: {
  participant: SessionParticipant;
  steps: SessionStepView[];
  /** Etiqueta extra da linha (ex.: categoria da compra, na recepção). */
  tag?: string;
  canRemove: boolean;
  removeTitle: string;
  /** Sem manejos a registrar, a linha não abre nada. */
  onOpen?: () => void;
  onRemove: () => void;
}) {
  const { animal } = participant;
  const view = sessionView(animal, participant.sessionValues);
  const unavailable = animal.unavailableReason;
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card pr-2 transition-colors",
        unavailable
          ? "border-destructive/50 bg-destructive/5"
          : "border-border",
        onOpen && "hover:bg-accent/40",
      )}
      title={
        unavailable
          ? `${unavailable}: remova o animal para poder consolidar.`
          : undefined
      }
    >
      {/* div em vez de <button>: a identificação do animal já contém um botão (RFID). */}
      <div
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (onOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          onOpen && "cursor-pointer",
        )}
      >
        <div className="min-w-32">
          <AnimalIdentification animal={view.identity} fresh={view.fresh} />
        </div>
        <span className="shrink-0">{SEX_ICON[animal.sex] ?? animal.sex}</span>
        <span className="max-w-40 truncate text-sm text-muted-foreground">
          {animal.currentBatch?.name ?? "Sem lote"}
        </span>
        {tag && (
          <span className="max-w-56 truncate rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
          {view.weightKg != null ? `${view.weightKg} kg` : "—"}
          {view.freshWeight && <NewValueMark />}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {unavailable && (
            <span className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" /> {unavailable}
            </span>
          )}
          {participant.status !== "pending" && steps.length > 0 && (
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
          title={removeTitle}
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      {onOpen && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      )}
    </li>
  );
}

/**
 * Lista de participantes em abas por situação, paginada. Sem manejos (recepção só de
 * cadastro) não há situação a separar: vira uma lista só, com o último primeiro.
 */
export function ParticipantTabs({
  participants,
  steps,
  search,
  editable,
  labels,
  emptyMessages,
  tagOf,
  removeTitle,
  onOpen,
  onRemove,
}: {
  /** Todos os participantes (a busca é aplicada aqui). */
  participants: SessionParticipant[];
  steps: SessionStepView[];
  search: string;
  editable: boolean;
  labels: Record<ParticipantStatus, string>;
  emptyMessages: Record<ParticipantStatus, string> & { none: string };
  tagOf?: (p: SessionParticipant) => string | undefined;
  removeTitle: string;
  onOpen: (p: SessionParticipant) => void;
  onRemove: (p: SessionParticipant) => void;
}) {
  const [tab, setTab] = useState<ParticipantStatus>("pending");
  // A página volta para a primeira quando a busca muda.
  const [pageState, setPageState] = useState({ search, page: 0 });
  const page = pageState.search === search ? pageState.page : 0;
  const setPage = (p: number) => setPageState({ search, page: p });

  const filtered = participants.filter((p) => matchesParticipant(p, search));
  const lists = groupParticipants(filtered);
  const hasSteps = steps.length > 0;
  const current = hasSteps ? lists[tab] : lists.done;
  const pageCount = Math.ceil(current.length / PAGE_SIZE);
  // Remoções ou registros podem encolher a aba; não deixa a página ficar vazia.
  const safePage = Math.min(page, Math.max(pageCount - 1, 0));

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as ParticipantStatus);
        setPage(0);
      }}
      className="gap-3"
    >
      {hasSteps && (
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {labels[t]} ({lists[t].length})
            </TabsTrigger>
          ))}
        </TabsList>
      )}

      {current.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          {search
            ? hasSteps
              ? "Nenhum animal encontrado nesta aba."
              : "Nenhum animal encontrado."
            : !participants.length
              ? emptyMessages.none
              : emptyMessages[tab]}
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
                tag={tagOf?.(p)}
                canRemove={editable}
                removeTitle={removeTitle}
                // Animal que não pode mais participar não abre o registro, só sai.
                onOpen={
                  hasSteps && !p.animal.unavailableReason
                    ? () => onOpen(p)
                    : undefined
                }
                onRemove={() => onRemove(p)}
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

export function SessionDateDialog({
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
