import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
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
import { FieldRow } from "@/components/our/FieldRow";
import { FormActionBar } from "@/components/our/FormActionBar";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { z } from "zod";
import { batchFieldsSchema, requireBatchGoal } from "@ifarm/shared";
import type { BatchAreaChangeData } from "./BatchAreaChangeDialog";
import { batchClient } from "@/lib/clients";
import { isNotFoundError, type BatchDetail } from "@ifarm/shared";
import { applyServerErrors } from "@/lib/form-errors";
import { BatchAreaChangeDialog } from "./BatchAreaChangeDialog";
import { batchDetailQuery, batchKeys } from "./queries";
import { useAvailableAreaOptions } from "./useAvailableAreaOptions";
import { FormSkeleton } from "@/components/our/PageSkeletons";

// Um formulário para criar e editar: os campos e as regras da API (batchFieldsSchema e a
// meta, RN-LOTE-04), mais a área. Na edição a área só é exibida; a troca vai pelo diálogo.
const batchFormSchema = batchFieldsSchema
  .extend({ areaId: z.string().min(1, "Este campo é obrigatório") })
  .superRefine(requireBatchGoal);
type BatchFormData = z.input<typeof batchFormSchema>;

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const propertyId = currentProperty?.id;

  // Lote em edição (só com id).
  const {
    data: editingBatch,
    error,
    isPending,
    refetch,
  } = useQuery({ ...batchDetailQuery(id ?? ""), enabled: isEditing });
  // Áreas livres para o lote novo (na edição, a troca vai pelo diálogo). Sem a propriedade
  // atual, a busca traria áreas de todas.
  const areas = useAvailableAreaOptions({
    propertyId,
    enabled: !isEditing && !isPropertyLoading,
  });

  const [pendingAreaId, setPendingAreaId] = useState<string | null>(null);
  const [pendingAreaName, setPendingAreaName] = useState<string | null>(null);
  // Descrição da troca de área informada no diálogo (vai junto com newAreaId).
  const [pendingAreaDescription, setPendingAreaDescription] = useState<
    string | undefined
  >(undefined);
  const [areaChangeOpen, setAreaChangeOpen] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema, undefined, { raw: true }),
    // Dados do lote em edição. Se forem buscados de novo em segundo plano, só os campos que o
    // usuário não alterou são atualizados (keepDirtyValues).
    values: editingBatch && toFormValues(editingBatch),
    resetOptions: { keepDirtyValues: true },
    defaultValues: {
      name: "",
      areaId: "",
      notes: "",
      hasMeta: false,
      targetDate: "",
      targetWeight: "",
    },
  });

  const hasMeta = useWatch({ control, name: "hasMeta" });

  // Lote novo: a área escolhida é da propriedade atual; ao trocar de propriedade, sai.
  useEffect(() => {
    if (!isEditing) setValue("areaId", "");
  }, [propertyId, isEditing, setValue]);

  const reloadBatches = () =>
    queryClient.invalidateQueries({ queryKey: batchKeys.all });
  const create = useMutation({
    mutationFn: (data: BatchFormData) =>
      batchClient.createBatch({ ...data, propertyId }),
    onSuccess: reloadBatches,
  });
  // A troca de área escolhida no diálogo vai junto com os dados do lote.
  const update = useMutation({
    mutationFn: (data: BatchFormData) =>
      batchClient.updateBatch(id!, {
        name: data.name,
        notes: data.notes,
        hasMeta: data.hasMeta,
        targetDate: data.targetDate,
        targetWeight: data.targetWeight,
        ...(pendingAreaId && {
          newAreaId: pendingAreaId,
          areaChangeDescription: pendingAreaDescription,
        }),
      }),
    onSuccess: reloadBatches,
  });

  async function onSubmit(data: BatchFormData) {
    try {
      if (id) {
        await update.mutateAsync(data);
        // Volta o formulário ao estado "sem alterações", com os dados salvos (e o cache junto).
        const fresh = await queryClient.query(batchDetailQuery(id));
        reset(toFormValues(fresh));
        setPendingAreaId(null);
        setPendingAreaName(null);
        setPendingAreaDescription(undefined);
        toast.success("Registro atualizado com sucesso!");
        onSuccess?.();
      } else {
        const response = await create.mutateAsync(data);
        toast.success("Registro salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      applyServerErrors(setError, error);
    }
  }

  function handleAreaChangeConfirm(
    data: BatchAreaChangeData,
    areaName?: string,
  ) {
    setPendingAreaId(data.newAreaId);
    setPendingAreaName(areaName ?? "Área selecionada");
    setPendingAreaDescription(data.description);
    setValue("areaId", data.newAreaId, { shouldValidate: true });
  }

  const currentAreaName = editingBatch?.currentArea?.name ?? null;
  const displayAreaName = pendingAreaName ?? currentAreaName;

  if (isEditing && isPending) {
    return <FormSkeleton />;
  }

  if (isEditing && !editingBatch) {
    // Não existe mais (ex.: excluído por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Lote não encontrado"
          message="Ele pode ter sido excluído."
          onBack={() => navigate("/lotes")}
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
                    items={areas.items}
                    onInputValueChange={areas.search}
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
