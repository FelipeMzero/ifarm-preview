"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Info,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@/lib/field-limits";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FormField } from "@/components/our/FormField";
import FormSkeleton from "@/components/our/FormSkeleton";
import FieldRow from "@/components/our/FieldRow";
import {
  SearchCombobox,
  SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { AnimalIdentification, SEX_ICON } from "@/features/animal/display";
import { cn } from "@/lib/utils";
import { BatchForm } from "@/features/batch/BatchForm";
import { getBatch, getBatches } from "@/features/batch/services";
import { StockingNotice } from "@/features/area/StockingNotice";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { AnimalPicker, toTransferAnimal } from "./AnimalPicker";
import { getAnimals } from "@/features/animal/services";
import { TransferStatusBadge } from "./display";
import { BatchTransferFormData, batchTransferFormSchema } from "./schema";
import {
  ApiError,
  BatchTransferDetail,
  TransferAnimal,
  createBatchTransfer,
  getBatchTransfer,
  updateBatchTransfer,
} from "./services";

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

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function toFormValues(detail: BatchTransferDetail): BatchTransferFormData {
  return {
    destinationBatchId: detail.destinationBatch.id,
    transferDate: detail.transferDate,
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
  const { property: currentProperty } = useCurrentProperty();
  const propertyId = currentProperty?.id;

  const [isDataLoading, setIsDataLoading] = useState(isEditing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [detail, setDetail] = useState<BatchTransferDetail | null>(null);
  const [selected, setSelected] = useState<TransferAnimal[]>([]);
  const [animalsError, setAnimalsError] = useState<string | null>(null);
  // Com o destino pré-definido os dados já estão completos (a data padrão é hoje).
  const [step, setStep] = useState<FormStep>(
    initialDestinationBatchId ? "animals" : "data",
  );
  const [presetBatch, setPresetBatch] = useState<SearchComboboxItem | null>(
    null,
  );
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const [batchItems, setBatchItems] = useState<SearchComboboxItem[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    trigger,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<BatchTransferFormData>({
    resolver: zodResolver(batchTransferFormSchema),
    defaultValues: {
      destinationBatchId: initialDestinationBatchId ?? "",
      transferDate: todayIso(),
      notes: "",
    },
  });

  const destinationBatchId = watch("destinationBatchId");
  const readOnly = detail !== null && detail.status !== "pending";

  const selectedIds = useMemo(
    () => new Set(selected.map((a) => a.id)),
    [selected],
  );

  const loadBatches = useCallback(
    async (q: string) => {
      try {
        const result = await getBatches({
          propertyId,
          status: "active",
          search: q,
          pageSize: 20,
        });
        setBatchItems(result.data.map((b) => ({ value: b.id, label: b.name })));
      } catch (err) {
        console.error("Erro ao carregar lotes para transferência:", err);
        setBatchItems([]);
      }
    },
    [propertyId],
  );

  const handleSearchBatches = useCallback(
    (query: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => loadBatches(query), 300);
    },
    [loadBatches],
  );

  useEffect(() => {
    loadBatches("");
  }, [loadBatches]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setIsDataLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const data = await getBatchTransfer(id!);
        if (cancelled) return;
        setDetail(data);
        setSelected(data.animals);
        reset(toFormValues(data));
        // Num plano já criado os dados estão completos; o que mais se ajusta é
        // a seleção de animais.
        setStep("animals");
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  useEffect(() => {
    if (!initialOriginBatchId) return;
    let cancelled = false;
    getAnimals({
      propertyId,
      batchId: initialOriginBatchId,
      status: "ACTIVE",
      pageSize: 2000,
    })
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
  }, [initialOriginBatchId, propertyId]);

  useEffect(() => {
    if (!initialDestinationBatchId) return;
    let cancelled = false;
    getBatch(initialDestinationBatchId)
      .then((b) => {
        if (!cancelled) setPresetBatch({ value: b.id, label: b.name });
      })
      .catch(() => {
        // Sem o nome o campo mostra só o id; o usuário pode escolher outro lote.
      });
    return () => {
      cancelled = true;
    };
  }, [initialDestinationBatchId]);

  // Garante que o destino já gravado (ou pré-definido) tenha rótulo, mesmo fora da
  // busca atual.
  const comboItems = useMemo(() => {
    const saved = detail?.destinationBatch
      ? {
          value: detail.destinationBatch.id,
          label: detail.destinationBatch.name,
        }
      : presetBatch;
    if (!saved || batchItems.some((i) => i.value === saved.value)) {
      return batchItems;
    }
    return [saved, ...batchItems];
  }, [batchItems, detail, presetBatch]);

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

  async function onSubmit(data: BatchTransferFormData) {
    const payload = {
      ...data,
      animalIds: selected.map((a) => a.id),
      propertyId,
    };

    try {
      if (id) {
        await updateBatchTransfer(id, payload);
        toast.success("Transferência atualizada com sucesso!");
        onSuccess?.(id);
      } else {
        const response = await createBatchTransfer(payload);
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

  const weights = selected
    .map((a) => a.currentWeightKg)
    .filter((w): w is number => w != null);
  const avgWeight = weights.length
    ? weights.reduce((sum, w) => sum + w, 0) / weights.length
    : null;

  // Ex.: animal vendido ou movido para o destino depois de entrar no plano.
  const isInvalid = (a: TransferAnimal) =>
    a.status !== "ACTIVE" || a.currentBatch?.id === destinationBatchId;

  // Depois de confirmada, o lote que interessa é o de onde o animal saiu.
  const showOrigin = detail?.status === "confirmed";

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
    comboItems.find((i) => i.value === destinationBatchId)?.label ?? null;

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isDataLoading) {
    return <FormSkeleton />;
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
                      items={comboItems}
                      onInputValueChange={handleSearchBatches}
                      placeholder="Buscar lote..."
                      emptyMessage="Nenhum lote disponível"
                      onCreateClick={() => setIsBatchModalOpen(true)}
                    />
                  )}
                />
                <FormField
                  name="transferDate"
                  control={control}
                  label="Data da Transferência"
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

            <div
              className={readOnly ? "grid gap-6" : "grid gap-6 lg:grid-cols-2"}
            >
              {!readOnly && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium uppercase text-muted-foreground">
                    Selecionar animais
                  </h3>
                  <AnimalPicker
                    propertyId={propertyId}
                    destinationBatchId={destinationBatchId}
                    initialBatchFilter={initialOriginBatchId}
                    selectedIds={selectedIds}
                    onAdd={addAnimals}
                    onRemove={removeAnimals}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex h-5 items-center justify-between">
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

                {avgWeight != null && (
                  <p className="text-sm text-muted-foreground">
                    Peso médio atual:{" "}
                    <span className="font-medium text-foreground">
                      {avgWeight.toFixed(1)} kg
                    </span>
                  </p>
                )}

                {selected.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                    Nenhum animal adicionado.
                  </div>
                ) : (
                  <div className="max-h-120 overflow-y-auto rounded-md border border-border">
                    <Table className="[&_tr]:border-border">
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="bg-muted">
                          <TableHead className="text-muted-foreground">
                            Identificação
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            {showOrigin ? "Lote de origem" : "Lote atual"}
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Sexo
                          </TableHead>
                          <TableHead className="text-right text-muted-foreground">
                            Peso
                          </TableHead>
                          {!readOnly && <TableHead className="w-10" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.map((animal) => (
                          <TableRow key={animal.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <AnimalIdentification animal={animal} />
                                {!readOnly && isInvalid(animal) && (
                                  <span
                                    title="Este animal não está mais ativo ou já está no lote de destino. Remova-o para poder salvar."
                                    className="text-destructive"
                                  >
                                    <CircleAlert className="size-4" />
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-32 truncate text-muted-foreground">
                              {(showOrigin
                                ? animal.originBatch?.name
                                : animal.currentBatch?.name) ?? "Sem lote"}
                            </TableCell>
                            <TableCell>
                              {SEX_ICON[animal.sex] ?? animal.sex}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {animal.currentWeightKg != null
                                ? `${animal.currentWeightKg} kg`
                                : "—"}
                            </TableCell>
                            {!readOnly && (
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Remover da transferência"
                                  onClick={() => removeAnimals([animal.id])}
                                >
                                  <X className="size-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
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
                await loadBatches("");
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
