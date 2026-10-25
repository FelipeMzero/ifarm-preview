import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { z } from "zod";
import { batchFieldsSchema } from "@ifarm/shared";
import { useAvailableAreaOptions } from "./useAvailableAreaOptions";
import { StockingNotice } from "@/features/area/StockingNotice";

// Estado do diálogo: a área de destino e a descrição da troca, que viram
// newAreaId/areaChangeDescription no PUT do lote.
const batchAreaChangeSchema = z.object({
  newAreaId: z.string().min(1, "A área de destino deve ser selecionada."),
  description: batchFieldsSchema.shape.notes,
});
export type BatchAreaChangeData = z.input<typeof batchAreaChangeSchema>;

interface BatchAreaChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAreaId: string | null;
  /** Lote sendo movido; usado na prévia de lotação da área de destino. */
  batchId?: string;
  onConfirm: (data: BatchAreaChangeData, areaName?: string) => void;
  propertyId?: string;
}

export function BatchAreaChangeDialog({
  open,
  onOpenChange,
  currentAreaId,
  batchId,
  onConfirm,
  propertyId,
}: BatchAreaChangeDialogProps) {
  // Áreas livres da propriedade, menos a atual (só com o diálogo aberto).
  const areas = useAvailableAreaOptions({
    propertyId,
    exclude: currentAreaId,
    enabled: open,
  });

  const form = useForm<BatchAreaChangeData>({
    resolver: zodResolver(batchAreaChangeSchema, undefined, { raw: true }),
    defaultValues: { newAreaId: "", description: "" },
  });
  const newAreaId = useWatch({ control: form.control, name: "newAreaId" });

  // Ao fechar, o diálogo volta ao estado inicial (abre limpo na próxima vez).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset({ newAreaId: "", description: "" });
      areas.clearSearch();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(data: BatchAreaChangeData) {
    const selectedItem = areas.items.find(
      (item) => item.value === data.newAreaId,
    );
    onConfirm(data, selectedItem?.label);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar Área do Lote</DialogTitle>
          <DialogDescription>
            Selecione a área de destino para o lote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            name="newAreaId"
            control={form.control}
            label="Área de Destino"
            required
            render={({ field, fieldState, id }) => (
              <SearchCombobox
                id={id}
                field={field}
                fieldState={fieldState}
                items={areas.items}
                onInputValueChange={areas.search}
                placeholder="Buscar área disponível..."
                emptyMessage="Nenhuma área disponível"
              />
            )}
          />

          <StockingNotice
            request={
              newAreaId && batchId
                ? { areaId: newAreaId, batchIds: [batchId] }
                : null
            }
          />

          <FormField
            name="description"
            control={form.control}
            label="Descrição"
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Observação sobre a troca de área..."
                className="resize-none"
                rows={3}
              />
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Troca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
