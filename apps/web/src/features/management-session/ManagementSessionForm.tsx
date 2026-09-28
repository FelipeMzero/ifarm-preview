"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@/lib/field-limits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FieldSet } from "@/components/ui/field";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FormField } from "@/components/our/FormField";
import FormSkeleton from "@/components/our/FormSkeleton";
import FieldRow from "@/components/our/FieldRow";
import {
  AnimalPickerFilters,
  AnimalPickerPagination,
  AnimalPickerTable,
  useAnimalPicker,
} from "@/features/batch-transfer/AnimalPicker";
import {
  SelectedAnimalsPagination,
  SelectedAnimalsSummary,
  SelectedAnimalsTable,
  useSelectedPage,
} from "@/features/batch-transfer/SelectedAnimals";
import type { TransferAnimal } from "@/features/batch-transfer/services";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { SessionStatusBadge, formatSessionDate, todayIso } from "./display";
import { planFormSchema, toStepPayload, type PlanFormData } from "./schema";
import {
  ApiError,
  createManagementSession,
  getManagementOptions,
  getManagementSession,
  updateManagementSession,
  type ManagementOptions,
  type ManagementSessionDetail,
} from "./services";
import { StepsEditor } from "./StepsEditor";
import { clientStepModule } from "./steps/registry";

type FormStep = "data" | "animals";

const STEPS: { value: FormStep; label: string }[] = [
  { value: "data", label: "Dados e manejos" },
  { value: "animals", label: "Animais" },
];

type ManagementSessionFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (id: string, created: boolean) => void;
};

function toFormValues(detail: ManagementSessionDetail): PlanFormData {
  return {
    title: detail.title,
    scheduledDate: detail.scheduledDate,
    notes: detail.notes ?? "",
    steps: detail.steps.map((step) => ({
      type: step.type,
      ...(clientStepModule(step.type).toPlanForm?.(step) ?? {}),
    })),
  };
}

const EMPTY_OPTIONS: ManagementOptions = {
  healthTypes: [],
  neuteringTechniques: [],
  people: [],
  batches: [],
};

export function ManagementSessionForm({
  id,
  title,
  onCancel,
  onSuccess,
}: ManagementSessionFormProps) {
  const isEditing = !!id;
  const { property: currentProperty } = useCurrentProperty();
  const propertyId = currentProperty?.id;

  const [isDataLoading, setIsDataLoading] = useState(isEditing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [detail, setDetail] = useState<ManagementSessionDetail | null>(null);
  const [options, setOptions] = useState<ManagementOptions>(EMPTY_OPTIONS);
  const [selected, setSelected] = useState<TransferAnimal[]>([]);
  const [animalsError, setAnimalsError] = useState<string | null>(null);
  const [step, setStep] = useState<FormStep>("data");

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: "",
      scheduledDate: todayIso(),
      notes: "",
      steps: [],
    },
  });

  const readOnly =
    detail !== null &&
    (detail.status === "confirmed" || detail.status === "cancelled");

  const selectedIds = useMemo(
    () => new Set(selected.map((a) => a.id)),
    [selected],
  );

  const selectedPagination = useSelectedPage(selected);
  // As etapas do planejamento definem com o que os animais não podem conflitar. Um
  // procedimento sanitário ainda não salvo não tem chave (é novo, não conflita).
  const plannedSteps = useWatch({ control, name: "steps" });
  const stepKeys = (plannedSteps ?? []).flatMap((s) =>
    s.type !== "health"
      ? [s.type]
      : s.healthManagementId
        ? [`health:${s.healthManagementId}`]
        : [],
  );
  const picker = useAnimalPicker({
    propertyId,
    destinationBatchId: "",
    selectedIds,
    onAdd: addAnimals,
    onRemove: removeAnimals,
    intent: { kind: "session", stepKeys },
    exclude: id ? { sessionId: id } : undefined,
  });

  useEffect(() => {
    let cancelled = false;
    getManagementOptions(propertyId)
      .then((result) => {
        if (!cancelled) setOptions(result);
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível carregar as opções.");
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getManagementSession(id)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setSelected(data.participants.map((p) => p.animal));
        reset(toFormValues(data));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  function addAnimals(animals: TransferAnimal[]) {
    if (!animals.length) return;
    setAnimalsError(null);
    setSelected((prev) => {
      const ids = new Set(prev.map((a) => a.id));
      return [...prev, ...animals.filter((a) => !ids.has(a.id))];
    });
  }

  function removeAnimals(ids: string[]) {
    const toRemove = new Set(ids);
    setSelected((prev) => prev.filter((a) => !toRemove.has(a.id)));
  }

  async function onSubmit(data: PlanFormData) {
    const payload = {
      title: data.title,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
      steps: data.steps.map(toStepPayload),
      animalIds: selected.map((a) => a.id),
      propertyId,
    };

    try {
      if (id) {
        await updateManagementSession(id, payload);
        toast.success("Planejamento atualizado!");
        onSuccess?.(id, false);
      } else {
        const response = await createManagementSession(payload);
        toast.success("Sessão de manejo planejada!");
        onSuccess?.(response.data.id, true);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const fields = Object.keys(error.errors);
        Object.entries(error.errors).forEach(([field, message]) => {
          if (field === "animalIds") setAnimalsError(message);
          else
            setError(field as keyof PlanFormData, { type: "server", message });
        });
        setStep(fields.some((f) => f !== "animalIds") ? "data" : "animals");
        toast.error(error.message);
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  function onInvalid() {
    setStep("data");
    toast.error("Verifique os campos destacados.");
  }

  async function goToAnimals() {
    if (readOnly || (await trigger())) setStep("animals");
    else toast.error("Preencha os dados e os manejos para continuar.");
  }

  // Enter num campo da etapa "Dados" avança em vez de salvar.
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (step === "data" && !readOnly) {
      e.preventDefault();
      goToAnimals();
      return;
    }
    handleSubmit(onSubmit, onInvalid)(e);
  }

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isDataLoading) return <FormSkeleton />;

  const dataHasError = Object.keys(errors).length > 0;

  return (
    <form
      className="mx-auto flex w-full max-w-300 flex-col gap-4"
      onSubmit={handleFormSubmit}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => onCancel?.()}
      >
        <ArrowLeft className="size-4" /> Voltar
      </Button>

      <div className="flex items-center gap-3">
        {title && <h1 className="text-2xl font-semibold">{title}</h1>}
        {detail && <SessionStatusBadge status={detail.status} />}
      </div>
      <Separator />

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {detail?.status === "confirmed"
          ? `Manejo consolidado em ${new Date(detail.confirmedAt!).toLocaleString("pt-BR")}${
              detail.managementDate
                ? ` (realizado em ${formatSessionDate(detail.managementDate)})`
                : ""
            }. Não pode mais ser alterado.`
          : detail?.status === "cancelled"
            ? `Sessão cancelada em ${new Date(detail.cancelledAt!).toLocaleString("pt-BR")}. Nenhum registro passou a valer.`
            : "O planejamento define a data prevista, os manejos (na ordem em que serão feitos em cada animal) e os animais. Os registros só passam a valer quando a sessão for consolidada."}
      </div>

      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((item, index) => {
          const active = step === item.value;
          const done = !readOnly && item.value === "data" && step === "animals";
          const hasError =
            item.value === "data" ? dataHasError : !!animalsError;
          return (
            <li key={item.value} className="flex items-center gap-2">
              {index > 0 && <span className="h-px w-8 bg-border" />}
              <button
                type="button"
                onClick={() =>
                  item.value === "data" ? setStep("data") : goToAnimals()
                }
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-xs",
                    hasError
                      ? "border-destructive text-destructive"
                      : active || done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                  )}
                >
                  {done && !hasError ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                {item.value === "animals"
                  ? `${item.label} (${selected.length})`
                  : item.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        {/* As duas etapas ficam montadas para não perder filtros/página ao alternar. */}
        <div className={step === "data" ? "space-y-6" : "hidden"}>
          <FieldSet className="border-0 p-0" disabled={readOnly}>
            <FieldRow cols={2}>
              <FormField
                name="title"
                control={control}
                label="Título"
                required
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.managementSession.title}
                    placeholder="Ex: Pesagem mensal da recria"
                  />
                )}
              />
              <FormField
                name="scheduledDate"
                control={control}
                label="Data prevista"
                required
                render={({ field, id: fieldId }) => (
                  <Input {...field} id={fieldId} type="date" />
                )}
              />
            </FieldRow>
            <FieldRow>
              <FormField
                name="notes"
                control={control}
                label="Observação"
                render={({ field, id: fieldId }) => (
                  <Textarea
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.managementSession.notes}
                    placeholder="Objetivo ou detalhes do manejo..."
                    className="resize-none"
                    rows={2}
                  />
                )}
              />
            </FieldRow>
          </FieldSet>

          <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase text-muted-foreground">
              Manejos (na ordem de registro)
            </h3>
            <FieldSet className="border-0 p-0" disabled={readOnly}>
              <StepsEditor
                control={control}
                options={options}
                disabled={readOnly}
              />
            </FieldSet>
          </div>
        </div>

        <div className={step === "animals" ? "space-y-4" : "hidden"}>
          {animalsError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {animalsError}
            </div>
          )}

          {/* Grade de 4 linhas (título, filtros/resumo, tabela, paginação) compartilhadas
              pelas duas colunas: topos e bases das tabelas ficam alinhados. No celular
              vira uma coluna só, na ordem do código. */}
          <div
            className={cn(
              "grid gap-x-6 gap-y-3",
              !readOnly && "lg:grid-cols-2",
            )}
          >
            {!readOnly && (
              <>
                <h3 className="flex h-8 items-center text-sm font-medium uppercase text-muted-foreground lg:col-start-1 lg:row-start-1">
                  Selecionar animais
                </h3>
                <AnimalPickerFilters
                  picker={picker}
                  className="lg:col-start-1 lg:row-start-2"
                />
                <AnimalPickerTable
                  picker={picker}
                  className="lg:col-start-1 lg:row-start-3"
                />
                <AnimalPickerPagination
                  picker={picker}
                  className="lg:col-start-1 lg:row-start-4"
                />
              </>
            )}

            <div
              className={cn(
                "flex h-8 items-center justify-between",
                !readOnly && "max-lg:mt-4 lg:col-start-2 lg:row-start-1",
              )}
            >
              <h3 className="text-sm font-medium uppercase text-muted-foreground">
                Animais no manejo ({selected.length})
              </h3>
              {!readOnly && selected.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setSelected([])}
                >
                  <Trash2 className="size-4" /> Remover todos
                </Button>
              )}
            </div>
            <SelectedAnimalsSummary
              animals={selected}
              className={cn(!readOnly && "lg:col-start-2 lg:row-start-2")}
            />
            <SelectedAnimalsTable
              animals={selected}
              pageAnimals={selectedPagination.pageAnimals}
              removeTitle="Remover do manejo"
              readOnly={readOnly}
              onRemove={(animalId) => removeAnimals([animalId])}
              className={cn(!readOnly && "lg:col-start-2 lg:row-start-3")}
            />
            <SelectedAnimalsPagination
              animals={selected}
              pagination={selectedPagination}
              className={cn(!readOnly && "lg:col-start-2 lg:row-start-4")}
            />
          </div>
        </div>
      </div>

      {!readOnly && (
        <FormActionBar>
          {step === "data" ? (
            <Button type="button" onClick={goToAnimals}>
              Próximo <ArrowRight className="size-4" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("data")}
              >
                <ArrowLeft className="size-4" /> Anterior
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Salvar
              </Button>
            </>
          )}
        </FormActionBar>
      )}
    </form>
  );
}
