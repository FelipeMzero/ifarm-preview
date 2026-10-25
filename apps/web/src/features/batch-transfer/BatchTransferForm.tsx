import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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

import { FIELD_LIMITS, nowDateTime } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FieldSet } from "@/components/ui/field";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import { cn } from "@/lib/utils";
import { BatchForm } from "@/features/batch/BatchForm";
import { batchDetailQuery } from "@/features/batch/queries";
import { useBatchOptions } from "@/features/batch/useBatchOptions";
import { StockingNotice } from "@/features/area/StockingNotice";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import {
  AnimalPickerFilters,
  AnimalPickerPagination,
  AnimalPickerTable,
  toTransferAnimal,
  useAnimalPicker,
} from "./AnimalPicker";
import {
  SelectedAnimalsPagination,
  SelectedAnimalsSummary,
  SelectedAnimalsTable,
  useSelectedPage,
} from "./SelectedAnimals";
import { animalListQuery } from "@/features/animal/queries";
import { TransferStatusBadge } from "./display";
import { z } from "zod";
import { batchTransferSchema } from "@ifarm/shared";
import { batchTransferClient } from "@/lib/clients";
import {
  ApiError,
  isNotFoundError,
  type BatchTransferDetail,
  type BatchTransferPayload,
  type TransferAnimal,
} from "@ifarm/shared";
import { batchTransferDetailQuery, batchTransferKeys } from "./queries";
import { FormSkeleton } from "@/components/our/PageSkeletons";

// Dados da transferência com as regras da API; os animais são escolhidos à parte e entram
// no envio (animalIds), com a propriedade atual.
const batchTransferFormSchema = batchTransferSchema.omit({
  animalIds: true,
  propertyId: true,
});
type BatchTransferFormData = z.input<typeof batchTransferFormSchema>;

type FormStep = "data" | "animals";

const STEPS: { value: FormStep; label: string }[] = [
  { value: "data", label: "Dados" },
  { value: "animals", label: "Animais" },
];

type BatchTransferFormProps = {
  id?: string;
  title?: string;
  /** Destino já escolhido (ex.: atalho "Transferir animais" do lote). */
  initialDestinationBatchId?: string;
  /** Lote a esvaziar: todos os seus animais ativos já entram na transferência. */
  initialOriginBatchId?: string;
  onCancel?: () => void;
  onSuccess?: (id: string) => void;
};

function toFormValues(detail: BatchTransferDetail): BatchTransferFormData {
  return {
    destinationBatchId: detail.destinationBatch.id,
    transferredAt: detail.transferredAt,
    notes: detail.notes ?? "",
  };
}

export function BatchTransferForm({
  id,
  title,
  initialDestinationBatchId,
  initialOriginBatchId,
  onCancel,
  onSuccess,
}: BatchTransferFormProps) {
  const isEditing = !!id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const propertyId = currentProperty?.id;

  // Transferência em edição (só com id).
  const {
    data: detail,
    error,
    isPending,
    refetch,
  } = useQuery({
    ...batchTransferDetailQuery(id ?? ""),
    enabled: isEditing,
  });
  // Destino pré-definido (atalho do lote): o nome, para o campo exibir.
  const { data: presetBatch } = useQuery({
    ...batchDetailQuery(initialDestinationBatchId ?? ""),
    enabled: !!initialDestinationBatchId && !isEditing,
  });

  const [selected, setSelected] = useState<TransferAnimal[]>([]);
  const [animalsError, setAnimalsError] = useState<string | null>(null);
  // Com o destino pré-definido os dados já estão completos (a data padrão é hoje).
  const [step, setStep] = useState<FormStep>(
    initialDestinationBatchId ? "animals" : "data",
  );
  // Num plano já criado, os animais dele entram na seleção (uma vez, ao carregar) e a etapa
  // é a dos animais: é o que mais se ajusta. Buscas em segundo plano não mexem na seleção.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (detail && loadedId !== detail.id) {
    setLoadedId(detail.id);
    setSelected(detail.animals);
    setStep("animals");
  }
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Opções do destino, com o já gravado ou o pré-definido no topo (para o campo ter o nome).
  const savedDestination = detail?.destinationBatch ?? presetBatch ?? null;
  const batches = useBatchOptions({
    selected: savedDestination && {
      id: savedDestination.id,
      name: savedDestination.name,
    },
  });

  const {
    handleSubmit,
    control,
    trigger,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<BatchTransferFormData>({
    resolver: zodResolver(batchTransferFormSchema, undefined, { raw: true }),
    // Dados da transferência em edição. Se forem buscados de novo em segundo plano, só os
    // campos que o usuário não alterou são atualizados (keepDirtyValues).
    values: detail && toFormValues(detail),
    resetOptions: { keepDirtyValues: true },
    defaultValues: {
      destinationBatchId: initialDestinationBatchId ?? "",
      transferredAt: nowDateTime(),
      notes: "",
    },
  });

  const destinationBatchId = useWatch({ control, name: "destinationBatchId" });
  const readOnly = !!detail && detail.status !== "pending";

  const selectedIds = useMemo(
    () => new Set(selected.map((a) => a.id)),
    [selected],
  );

  const selectedPagination = useSelectedPage(selected);
  const picker = useAnimalPicker({
    propertyId,
    destinationBatchId,
    initialBatchFilter: initialOriginBatchId,
    selectedIds,
    onAdd: addAnimals,
    onRemove: removeAnimals,
    intent: { kind: "transfer" },
    exclude: id ? { transferId: id } : undefined,
  });

  // Lote a esvaziar (atalho "encerrar lote com animais"): ao abrir, todos os animais ativos
  // dele entram na seleção. É uma ação de abertura da tela, uma vez só (depois de saber a
  // propriedade atual), e não um dado exibido: por isso no efeito, e não com useQuery.
  useEffect(() => {
    if (!initialOriginBatchId || isPropertyLoading) return;
    let cancelled = false;
    queryClient
      .query(
        animalListQuery({
          propertyId,
          batchId: initialOriginBatchId,
          status: "ACTIVE",
          pageSize: 2000,
        }),
      )
      .then((result) => {
        if (cancelled || !result.data.length) return;
        setSelected(result.data.map(toTransferAnimal));
        toast.info(
          `${result.data.length} animal(is) do lote ${result.data[0].currentBatch?.name ?? ""} adicionados. Escolha o destino.`,
        );
      })
      .catch(() =>
        toast.error("Não foi possível carregar os animais do lote."),
      );
    return () => {
      cancelled = true;
    };
  }, [initialOriginBatchId, isPropertyLoading, propertyId, queryClient]);

  // Animais que já estão no novo destino não têm o que transferir: saem do plano.
  function handleDestinationChange(
    value: string,
    onChange: (v: string) => void,
  ) {
    onChange(value);
    if (!value) return;
    const inDestination = selected.filter((a) => a.currentBatch?.id === value);
    if (inDestination.length) {
      removeAnimals(inDestination.map((a) => a.id));
      toast.info(
        `${inDestination.length} animal(is) que já estão no lote de destino foram removidos da transferência.`,
      );
    }
  }

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

  const reloadTransfers = () =>
    queryClient.invalidateQueries({ queryKey: batchTransferKeys.all });
  const create = useMutation({
    mutationFn: (payload: BatchTransferPayload) =>
      batchTransferClient.createBatchTransfer(payload),
    onSuccess: reloadTransfers,
  });
  const update = useMutation({
    mutationFn: (payload: BatchTransferPayload) =>
      batchTransferClient.updateBatchTransfer(id!, payload),
    onSuccess: reloadTransfers,
  });

  async function onSubmit(data: BatchTransferFormData) {
    const payload = {
      ...data,
      animalIds: selected.map((a) => a.id),
      propertyId,
    };

    try {
      if (id) {
        await update.mutateAsync(payload);
        toast.success("Transferência atualizada com sucesso!");
        onSuccess?.(id);
      } else {
        const response = await create.mutateAsync(payload);
        toast.success("Transferência salva como pendente!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const fields = Object.keys(error.errors);
        Object.entries(error.errors).forEach(([field, message]) => {
          if (field === "animalIds") setAnimalsError(message);
          else
            setError(field as keyof BatchTransferFormData, {
              type: "server",
              message,
            });
        });
        // Leva o usuário até a etapa do problema (prioriza os dados).
        setStep(fields.some((f) => f !== "animalIds") ? "data" : "animals");
        toast.error("Verifique os campos destacados.");
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  // Ex.: animal vendido ou movido para o destino depois de entrar no plano.
  const isInvalid = (a: TransferAnimal) =>
    !!a.unavailableReason ||
    a.status !== "ACTIVE" ||
    a.currentBatch?.id === destinationBatchId;

  // Depois de confirmada, o lote que interessa é o de onde o animal saiu.
  const showOrigin = detail?.status === "confirmed";
  const batchOf = (a: TransferAnimal) =>
    (showOrigin ? a.originBatch?.name : a.currentBatch?.name) ?? "Sem lote";

  // Todos os campos validados pelo formulário ficam na etapa "Dados".
  function onInvalid() {
    setStep("data");
    toast.error("Verifique os campos destacados.");
  }

  // A seleção de animais depende do destino, então só se avança com os dados válidos.
  async function goToAnimals() {
    if (readOnly || (await trigger())) setStep("animals");
    else toast.error("Preencha os dados da transferência para continuar.");
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

  const dataHasError = Object.keys(errors).length > 0;
  const destinationName =
    batches.items.find((i) => i.value === destinationBatchId)?.label ?? null;

  if (isEditing && isPending) {
    return <FormSkeleton />;
  }

  if (isEditing && !detail) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Transferência não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/lotes/transferencias")}
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
    <>
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
          {detail && <TransferStatusBadge status={detail.status} />}
        </div>
        <Separator />

        {readOnly ? (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {detail?.status === "confirmed"
              ? `Transferência confirmada em ${new Date(detail.confirmedAt!).toLocaleString("pt-BR")}. Não pode mais ser alterada.`
              : `Transferência cancelada em ${new Date(detail!.cancelledAt!).toLocaleString("pt-BR")}. Nenhum animal mudou de lote.`}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            Esta transferência é um plano: os animais só mudam de lote quando
            ela for confirmada na listagem de transferências.
          </div>
        )}

        <ol className="flex items-center gap-2 text-sm">
          {STEPS.map((item, index) => {
            const active = step === item.value;
            const done =
              !readOnly && item.value === "data" && step === "animals";
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
          <div className={step === "data" ? undefined : "hidden"}>
            <FieldSet className="border-0 p-0" disabled={readOnly}>
              <FieldRow cols={2}>
                <FormField
                  name="destinationBatchId"
                  control={control}
                  label="Lote de Destino"
                  required
                  render={({ field, fieldState, id: fieldId }) => (
                    <SearchCombobox
                      id={fieldId}
                      field={{
                        ...field,
                        onChange: (v: string) =>
                          handleDestinationChange(v, field.onChange),
                      }}
                      fieldState={fieldState}
                      items={batches.items}
                      onInputValueChange={batches.search}
                      placeholder="Buscar lote..."
                      emptyMessage="Nenhum lote disponível"
                      onCreateClick={() => setIsBatchModalOpen(true)}
                    />
                  )}
                />
                <FormField
                  name="transferredAt"
                  control={control}
                  label="Data da Transferência"
                  required
                  render={({ field, id: fieldId }) => (
                    <Input {...field} id={fieldId} type="datetime-local" />
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
                      maxLength={FIELD_LIMITS.batchTransfer.notes}
                      placeholder="Motivo ou detalhes da transferência..."
                      className="resize-none"
                      rows={3}
                    />
                  )}
                />
              </FieldRow>
            </FieldSet>
          </div>

          <div className={step === "animals" ? "space-y-4" : "hidden"}>
            {!readOnly && destinationName && (
              <p className="text-sm text-muted-foreground">
                Destino:{" "}
                <span className="font-medium text-foreground">
                  {destinationName}
                </span>
              </p>
            )}

            {!readOnly && (
              <StockingNotice
                showWhenOk
                request={
                  destinationBatchId
                    ? {
                        batchId: destinationBatchId,
                        animalIds: selected.map((a) => a.id),
                      }
                    : null
                }
              />
            )}

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
                  {readOnly
                    ? "Animais transferidos"
                    : "Animais na transferência"}{" "}
                  ({selected.length})
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
                batchOf={batchOf}
                className={cn(!readOnly && "lg:col-start-2 lg:row-start-2")}
              />
              <SelectedAnimalsTable
                animals={selected}
                pageAnimals={selectedPagination.pageAnimals}
                batchHeader={showOrigin ? "Lote de origem" : "Lote atual"}
                batchOf={batchOf}
                isInvalid={isInvalid}
                invalidTitle="Este animal não está mais ativo ou já está no lote de destino. Remova-o para poder salvar."
                removeTitle="Remover da transferência"
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

      {/* Fora do <form>: o BatchForm tem o próprio submit. */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Lote</DialogTitle>
            <DialogDescription className="sr-only">
              Cadastre um novo lote diretamente por esta tela.
            </DialogDescription>
          </DialogHeader>

          <BatchForm
            onCancel={() => setIsBatchModalOpen(false)}
            onSuccess={async (newId) => {
              setIsBatchModalOpen(false);
              if (newId) {
                // O lote cadastrado entra nas opções e já fica selecionado.
                await batches.addCreated(newId);
                // Lote recém-criado está vazio: nenhum animal selecionado precisa sair.
                setValue("destinationBatchId", newId, { shouldValidate: true });
                toast.success("Lote definido como destino da transferência.");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
