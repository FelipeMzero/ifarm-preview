import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import { FIELD_LIMITS } from "@ifarm/shared";
import { StockingNotice } from "@/features/area/StockingNotice";
import { batchClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import { batchReopenSchema, type BatchReopenPayload } from "@ifarm/shared";
import { availableAreasQuery, batchDetailQuery, batchKeys } from "./queries";
import { useAvailableAreaOptions } from "./useAvailableAreaOptions";

type ReopenData = BatchReopenPayload;

type ReopeningBatch = { id: string; name: string };

interface BatchReopenDialogProps {
  batch: ReopeningBatch | null;
  propertyId?: string;
  onOpenChange: (open: boolean) => void;
}

// Reativa um lote encerrado. Ao encerrar, a área foi liberada; se ela continua livre
// vem sugerida, senão o usuário escolhe outra área disponível.
export function BatchReopenDialog({
  batch,
  propertyId,
  onOpenChange,
}: BatchReopenDialogProps) {
  return (
    <Dialog open={batch !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reativar Lote</DialogTitle>
          <DialogDescription>
            {batch
              ? `O lote "${batch.name}" voltará a ficar vigente e poderá receber animais.`
              : null}
          </DialogDescription>
        </DialogHeader>

        {/* Um formulário por lote: abre sempre limpo, com a sugestão de área do lote. */}
        {batch && (
          <ReopenForm
            key={batch.id}
            batch={batch}
            propertyId={propertyId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReopenForm({
  batch,
  propertyId,
  onClose,
}: {
  batch: ReopeningBatch;
  propertyId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const areas = useAvailableAreaOptions({ propertyId });

  // A área anterior (o histórico vem da entrada mais recente para a mais antiga) e se ela
  // continua livre (está entre as áreas disponíveis, sem busca).
  const { data: detail, isPending: isDetailPending } = useQuery(
    batchDetailQuery(batch.id),
  );
  const { data: freeAreas, isPending: isAreasPending } = useQuery(
    availableAreasQuery("", propertyId),
  );
  const last = detail?.areaHistory[0]?.area;
  const previousArea =
    last && freeAreas
      ? { ...last, available: freeAreas.data.some((a) => a.id === last.id) }
      : null;
  const loading = isDetailPending || isAreasPending;

  const form = useForm<ReopenData>({
    resolver: zodResolver(batchReopenSchema, undefined, { raw: true }),
    // Com a área anterior livre, ela já vem selecionada (se o usuário ainda não escolheu outra).
    values: previousArea?.available
      ? { areaId: previousArea.id, notes: "" }
      : undefined,
    resetOptions: { keepDirtyValues: true },
    defaultValues: { areaId: "", notes: "" },
  });
  const areaId = useWatch({ control: form.control, name: "areaId" });

  const reopen = useMutation({
    mutationFn: (data: ReopenData) => batchClient.reopenBatch(batch.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
    },
  });

  async function handleSubmit(data: ReopenData) {
    try {
      await reopen.mutateAsync(data);
      toast.success(`Lote "${batch.name}" reativado.`);
      onClose();
    } catch (error) {
      applyServerErrors(form.setError, error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {previousArea &&
        (previousArea.available ? (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              A área anterior,{" "}
              <span className="font-medium text-foreground">
                {previousArea.name}
              </span>
              , continua livre e já foi selecionada.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <span className="text-muted-foreground">
              A área anterior,{" "}
              <span className="font-medium text-foreground">
                {previousArea.name}
              </span>
              , foi ocupada por outro lote. Escolha outra área.
            </span>
          </div>
        ))}

      <FormField
        name="areaId"
        control={form.control}
        label="Área"
        required
        render={({ field, fieldState, id }) => (
          <SearchCombobox
            id={id}
            field={field}
            fieldState={fieldState}
            items={areas.items}
            onInputValueChange={areas.search}
            placeholder={
              loading ? "Carregando..." : "Buscar área disponível..."
            }
            emptyMessage="Nenhuma área disponível"
          />
        )}
      />

      <StockingNotice
        request={areaId ? { areaId, batchIds: [batch.id] } : null}
      />

      <FormField
        name="notes"
        control={form.control}
        label="Motivo"
        render={({ field }) => (
          <Textarea
            {...field}
            maxLength={FIELD_LIMITS.batch.notes}
            placeholder="Ex.: lote encerrado por engano"
            className="resize-none"
            rows={3}
          />
        )}
      />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting || loading}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Reativar
        </Button>
      </DialogFooter>
    </form>
  );
}
