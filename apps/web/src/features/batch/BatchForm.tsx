"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRightLeft, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FIELD_LIMITS } from "@ifarm/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FormField } from "@/components/our/FormField";
import { ErrorPage } from "@/components/our/ErrorPage";
import FormSkeleton from "@/components/our/FormSkeleton";
import FieldRow from "@/components/our/FieldRow";
import { FormActionBar } from "@/components/our/FormActionBar";
import {
  SearchCombobox,
  SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { BatchFormData, batchFormSchema, BatchAreaChangeData } from "./schema";
import { batchClient } from "@/lib/clients";
import { ApiError, type BatchDetail } from "@ifarm/shared";
import { BatchAreaChangeDialog } from "./BatchAreaChangeDialog";

type BatchFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

function toFormValues(detail: BatchDetail): BatchFormData {
  return {
    name: detail.name,
    areaId: detail.currentArea?.id ?? "none",
    notes: detail.notes ?? "",
    hasMeta: detail.hasMeta,
    targetDate: detail.targetDate ?? "",
    targetWeight:
      detail.targetWeight != null ? String(detail.targetWeight) : "",
  };
}

export function BatchForm({ id, title, onCancel, onSuccess }: BatchFormProps) {
  const isEditing = !!id;
  const { property: currentProperty } = useCurrentProperty();
  const propertyId = currentProperty?.id;

  const [isDataLoading, setIsDataLoading] = useState(isEditing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchDetail | null>(null);
  const [pendingAreaId, setPendingAreaId] = useState<string | null>(null);
  const [pendingAreaName, setPendingAreaName] = useState<string | null>(null);
  const [areaChangeOpen, setAreaChangeOpen] = useState(false);

  const [areaItems, setAreaItems] = useState<SearchComboboxItem[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      areaId: "",
      notes: "",
      hasMeta: false,
      targetDate: "",
      targetWeight: "",
    },
  });

  const hasMeta = watch("hasMeta");

  const loadAreas = useCallback(
    async (q: string) => {
      try {
        const result = await batchClient.getAreasForBatch(q, propertyId);
        setAreaItems(result.data.map((a) => ({ value: a.id, label: a.name })));
      } catch (err) {
        console.error("Erro ao carregar áreas para o lote:", err);
        setAreaItems([]);
      }
    },
    [propertyId],
  );

  const handleSearchAreas = useCallback(
    (query: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        loadAreas(query);
      }, 300);
    },
    [loadAreas],
  );

  useEffect(() => {
    if (!isEditing) loadAreas("");
  }, [isEditing, loadAreas]);

  useEffect(() => {
    if (!isEditing) setValue("areaId", "");
  }, [propertyId, isEditing, setValue]);

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
        const detail = await batchClient.getBatch(id!);
        if (cancelled) return;
        setEditingBatch(detail);
        reset(toFormValues(detail));
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

  async function onSubmit(data: BatchFormData) {
    try {
      if (id) {
        const updateData: Parameters<typeof batchClient.updateBatch>[1] = {
          name: data.name,
          notes: data.notes,
          hasMeta: data.hasMeta,
          targetDate: data.targetDate,
          targetWeight: data.targetWeight,
        };

        if (pendingAreaId) {
          updateData.newAreaId = pendingAreaId;
        }

        await batchClient.updateBatch(id, updateData);
        const fresh = await batchClient.getBatch(id);
        setEditingBatch(fresh);
        reset(toFormValues(fresh));
        setPendingAreaId(null);
        setPendingAreaName(null);
        toast.success("Registro atualizado com sucesso!");
        onSuccess?.();
      } else {
        const response = await batchClient.createBatch({
          ...data,
          propertyId,
        });
        toast.success("Registro salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof BatchFormData, {
            type: "server",
            message,
          });
        });
        toast.error("Verifique os campos destacados.");
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  function handleAreaChangeConfirm(
    data: BatchAreaChangeData,
    areaName?: string,
  ) {
    setPendingAreaId(data.newAreaId);
    setPendingAreaName(areaName ?? "Área selecionada");
    setValue("areaId", data.newAreaId, { shouldValidate: true });
  }

  const currentAreaName = editingBatch?.currentArea?.name ?? null;
  const displayAreaName = pendingAreaName ?? currentAreaName;

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
        onSubmit={handleSubmit(onSubmit)}
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

        {title && <h1 className="text-2xl font-semibold">{title}</h1>}
        <Separator />

        <FieldSet className="border-0">
          <FieldLegend>Dados do Lote</FieldLegend>

          <FieldRow>
            <FormField
              name="name"
              control={control}
              label="Nome do Lote"
              required
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.batch.name}
                  placeholder="Ex: Lote 01, Engorda I"
                />
              )}
            />
          </FieldRow>

          {isEditing ? (
            <div className="space-y-2">
              <label
                htmlFor="currentAreaDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                Área Atual
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="currentAreaDisplay"
                  readOnly
                  value={displayAreaName ?? "Nenhuma área"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar área"
                  onClick={() => setAreaChangeOpen(true)}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
              </div>
              {editingBatch && editingBatch.areaHistory.length > 0 && (
                <Collapsible className="group/history mt-2">
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/history:rotate-180" />
                    Ver histórico de áreas ({editingBatch.areaHistory.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border text-xs">
                      {editingBatch.areaHistory.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between border-b border-border px-2 py-1 last:border-b-0"
                        >
                          <span>{h.area.name}</span>
                          <span className="text-muted-foreground">
                            {new Date(h.enteredAt).toLocaleDateString("pt-BR")}
                            {h.exitedAt
                              ? ` — ${new Date(h.exitedAt).toLocaleDateString("pt-BR")}`
                              : " — atual"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ) : (
            <FieldRow>
              <FormField
                name="areaId"
                control={control}
                label="Área"
                required
                render={({ field, fieldState, id: fieldId }) => (
                  <SearchCombobox
                    id={fieldId}
                    field={field}
                    fieldState={fieldState}
                    items={areaItems}
                    onInputValueChange={handleSearchAreas}
                    placeholder="Buscar área disponível..."
                    emptyMessage="Nenhuma área disponível"
                  />
                )}
              />
            </FieldRow>
          )}

          <FieldRow>
            <FormField
              name="notes"
              control={control}
              label="Descrição"
              render={({ field, id: fieldId }) => (
                <Textarea
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.batch.notes}
                  placeholder="Observação sobre o lote..."
                  className="resize-none"
                  rows={3}
                />
              )}
            />
          </FieldRow>
        </FieldSet>

        <FieldSet className="border-0">
          <FieldLegend>Meta de Venda</FieldLegend>

          <div className="flex items-center gap-2">
            <FormField
              name="hasMeta"
              control={control}
              label=""
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hasMeta"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                  <label htmlFor="hasMeta" className="text-sm font-medium">
                    Meta
                  </label>
                </div>
              )}
            />
          </div>

          {hasMeta && (
            <FieldRow cols={2}>
              <FormField
                name="targetDate"
                control={control}
                label="Data para Venda"
                required={hasMeta}
                render={({ field, id: fieldId }) => (
                  <Input {...field} id={fieldId} type="date" />
                )}
              />
              <FormField
                name="targetWeight"
                control={control}
                label="Peso Médio para Venda (kg)"
                required={hasMeta}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    type="number"
                    step="any"
                    placeholder="Ex: 550"
                  />
                )}
              />
            </FieldRow>
          )}
        </FieldSet>

        <FormActionBar>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </FormActionBar>
      </form>

      <BatchAreaChangeDialog
        open={areaChangeOpen}
        onOpenChange={setAreaChangeOpen}
        currentAreaId={editingBatch?.currentArea?.id ?? null}
        batchId={id}
        propertyId={propertyId}
        onConfirm={handleAreaChangeConfirm}
      />
    </>
  );
}
