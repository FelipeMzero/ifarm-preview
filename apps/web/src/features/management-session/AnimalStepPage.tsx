"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  SkipForward,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import FormSkeleton from "@/components/our/FormSkeleton";
import {
  AnimalIdentification,
  NewValueMark,
  SEX_ICON,
} from "@/features/animal/display";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import {
  ParticipantStatusBadge,
  STEP_ICONS,
  formatSessionDate,
} from "./display";
import {
  clearStepRecord,
  getManagementOptions,
  getSessionAnimal,
  saveStepRecord,
  type ManagementOptions,
  type SessionAnimalContext,
} from "./services";
import { sessionView } from "./SessionParticipants";
import { clientStepModule } from "./steps/registry";
import { formatKg } from "./steps/formHelpers";

const EMPTY_OPTIONS: ManagementOptions = {
  healthTypes: [],
  neuteringTechniques: [],
  people: [],
  batches: [],
};

const FORM_ID = "management-step-form";

// As telas de etapa servem ao registro de manejo e à recepção de compra: cada área
// informa onde fica a sua lista de animais (e, abaixo dela, /<animal>/<passo>).
export const sessionBoardPath = (sessionId: string) =>
  `/manejos/${sessionId}/registro`;

function stepUrl(boardPath: string, animalId: string, index: number) {
  return `${boardPath}/${animalId}/${index + 1}`;
}

// Primeiro passo sem registro (ou o primeiro, se todos já foram feitos).
export function firstPendingStep(context: SessionAnimalContext) {
  const index = context.steps.findIndex((s) => context.records[s.key] == null);
  return index === -1 ? 0 : index;
}

type AnimalStepPageProps = {
  sessionId: string;
  animalId: string;
  /** Lista de animais da área (registro de manejo por padrão). */
  boardPath?: string;
};

/**
 * Registro de um animal, etapa por etapa. Atende às URLs /<animal> (abre no primeiro
 * passo pendente) e /<animal>/<passo>. Trocar de passo só troca a URL
 * (history.pushState, integrado ao roteador do Next): a tela não é remontada nem
 * recarrega os dados, e o voltar do navegador continua passando pelos passos.
 */
export function AnimalStepPage({
  sessionId,
  animalId,
  boardPath = sessionBoardPath(sessionId),
}: AnimalStepPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { property: currentProperty } = useCurrentProperty();
  const [context, setContext] = useState<SessionAnimalContext | null>(null);
  const [options, setOptions] = useState<ManagementOptions>(EMPTY_OPTIONS);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  // Remonta a tela da etapa depois de desfazer, para limpar o formulário.
  const [version, setVersion] = useState(0);

  // Passo da URL (a partir de 1); sem passo = primeiro pendente.
  const animalPath = `${boardPath}/${animalId}`;
  const urlStep = pathname.startsWith(`${animalPath}/`)
    ? Number(pathname.slice(animalPath.length + 1)) || 1
    : null;

  useEffect(() => {
    let cancelled = false;
    getSessionAnimal(sessionId, animalId)
      .then((data) => {
        if (cancelled) return;
        setContext(data);
        // Aberto sem passo: fixa na URL o primeiro pendente (sem nova entrada no
        // histórico), para recarregar a página cair no mesmo passo.
        if (!window.location.pathname.startsWith(`${animalPath}/`)) {
          window.history.replaceState(
            null,
            "",
            stepUrl(boardPath, animalId, firstPendingStep(data)),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, animalId, boardPath, animalPath]);

  useEffect(() => {
    let cancelled = false;
    getManagementOptions(currentProperty?.id)
      .then((result) => {
        if (!cancelled) setOptions(result);
      })
      .catch(() => {
        // Sem as opções, só a apartação perde a lista de outros lotes.
      });
    return () => {
      cancelled = true;
    };
  }, [currentProperty?.id]);

  const index = context
    ? urlStep === null
      ? firstPendingStep(context)
      : Math.min(Math.max(urlStep - 1, 0), context.steps.length - 1)
    : 0;
  // Identifica a tela de etapa montada (muda ao trocar de passo ou desfazer).
  const screenKey = context?.steps[index]
    ? `${context.steps[index].key}-${version}`
    : null;

  // Foco no primeiro campo da etapa, para registrar tudo pelo teclado. Fica aqui (e não
  // em cada tela) para valer para qualquer módulo de etapa.
  useEffect(() => {
    if (!screenKey) return;
    document
      .getElementById(FORM_ID)
      ?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), button:not(:disabled)',
      )
      ?.focus();
  }, [screenKey]);

  if (failed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!context) return <FormSkeleton />;

  const { steps, animal, records } = context;
  const view = sessionView(animal, context.sessionValues);
  const current = steps[index];
  const readOnly = context.session.status !== "in_progress";
  const isLast = index === steps.length - 1;

  if (!current) {
    return (
      <ErrorPage
        message="Esta sessão não tem manejos definidos."
        onRetry={() => router.push(boardPath)}
      />
    );
  }

  const Screen = clientStepModule(current.type).Screen;
  const record = records[current.key] ?? null;

  function goTo(target: number) {
    window.history.pushState(null, "", stepUrl(boardPath, animalId, target));
  }

  function goNext() {
    if (isLast) {
      router.push(boardPath);
    } else {
      goTo(index + 1);
    }
  }

  async function handleSubmit(payload: unknown) {
    setSaving(true);
    try {
      const updated = await saveStepRecord(
        sessionId,
        animalId,
        current.key,
        payload,
      );
      if (isLast) toast.success("Registro do animal concluído.");
      else setContext(updated);
      goNext();
    } finally {
      setSaving(false);
    }
  }

  async function handleUndo() {
    setUndoing(false);
    try {
      setContext(await clearStepRecord(sessionId, animalId, current.key));
      toast.success("Registro desfeito.");
      // Remonta o formulário da etapa, que agora está sem registro.
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => router.push(boardPath)}
      >
        <ArrowLeft className="size-4" /> Lista de animais
      </Button>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card p-4">
        <div className="scale-110 origin-left">
          <AnimalIdentification animal={view.identity} fresh={view.fresh} />
        </div>
        {animal.name && (
          <span className="text-sm text-muted-foreground">{animal.name}</span>
        )}
        <span>{SEX_ICON[animal.sex] ?? animal.sex}</span>
        <span className="text-sm">
          <span className="text-muted-foreground">Lote: </span>
          {animal.currentBatch?.name ?? "Sem lote"}
        </span>
        <span className="flex items-center gap-1.5 text-sm tabular-nums">
          <span className="text-muted-foreground">Peso: </span>
          {view.weightKg != null ? formatKg(view.weightKg) : "—"}
          {view.freshWeight && <NewValueMark />}
        </span>
        {animal.neutered && <Badge variant="secondary">Castrado</Badge>}
        <span className="ml-auto">
          <ParticipantStatusBadge status={context.status} />
        </span>
      </div>

      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {steps.map((s, i) => {
          const Icon = STEP_ICONS[s.type];
          const done = records[s.key] != null;
          const active = i === index;
          return (
            <li key={s.key} className="flex items-center gap-1">
              {i > 0 && <span className="h-px w-3 bg-border" />}
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors hover:bg-muted",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-xs",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : (
                    <Icon className="size-3" />
                  )}
                </span>
                <span className="max-w-40 truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <Separator />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">
          <span className="text-muted-foreground">
            Passo {index + 1} de {steps.length} ·{" "}
          </span>
          {current.label}
        </h1>
        {record != null && <Badge>Registrado</Badge>}
        {record != null && !readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => setUndoing(true)}
          >
            <Undo2 className="size-4" /> Desfazer registro
          </Button>
        )}
      </div>

      {readOnly && (
        <p className="text-sm text-muted-foreground">
          {context.session.status === "planned"
            ? "O registro desta sessão ainda não foi iniciado."
            : `Sessão ${context.session.status === "confirmed" ? "consolidada" : "cancelada"}${
                context.session.managementDate
                  ? ` (manejo de ${formatSessionDate(context.session.managementDate)})`
                  : ""
              }: somente visualização.`}
        </p>
      )}

      <Screen
        key={`${current.key}-${version}`}
        formId={FORM_ID}
        step={current}
        animal={animal}
        record={record}
        records={records}
        options={options}
        readOnly={readOnly}
        onSubmit={handleSubmit}
      />

      <FormActionBar>
        {index > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo(index - 1)}
          >
            <ArrowLeft className="size-4" /> Anterior
          </Button>
        )}
        {readOnly ? (
          <Button type="button" onClick={goNext}>
            {isLast ? "Voltar à lista" : "Próximo"}
            {!isLast && <ArrowRight className="size-4" />}
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={goNext}>
              <SkipForward className="size-4" />
              Pular
            </Button>
            <Button type="submit" form={FORM_ID} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {isLast ? "Concluir" : "Avançar"}
              {!saving && !isLast && <ArrowRight className="size-4" />}
            </Button>
          </>
        )}
      </FormActionBar>

      <ConfirmDialog
        open={undoing}
        onOpenChange={setUndoing}
        onConfirm={handleUndo}
        title="Desfazer registro"
        description={`O registro de "${current.label}" deste animal será apagado. A etapa volta a ficar pendente.`}
        confirmLabel="Desfazer"
        cancelLabel="Voltar"
      />
    </div>
  );
}
