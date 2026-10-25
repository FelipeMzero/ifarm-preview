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

import { useBatchOptions } from "@/features/batch/useBatchOptions";
import { StockingNotice } from "@/features/area/StockingNotice";

// Estado do diálogo: o lote de destino é escolhido antes de salvar a edição (vira
// newBatchId/batchChangeNotes no PUT do animal).
const animalBatchChangeSchema = z.object({
  newBatchId: z.string().min(1, "Este campo não pode ser vazio"),
  notes: z.string().optional(),
});
type AnimalBatchChangeData = z.infer<typeof animalBatchChangeSchema>;

interface AnimalBatchChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBatchId: string | null;
  /** Animal sendo movido; usado na prévia de lotação da área de destino. */
  animalId?: string;
  propertyId?: string;
  onConfirm: (
    batchId: string,
    batchName: string | undefined,
    notes?: string,
  ) => void;
}

export function AnimalBatchChangeDialog({
  open,
  onOpenChange,
  currentBatchId,
  animalId,
  propertyId,
  onConfirm,
}: AnimalBatchChangeDialogProps) {
  // Lotes vigentes da propriedade do animal, menos o atual (só com o diálogo aberto).
  const batches = useBatchOptions({
    propertyId,
    exclude: currentBatchId,
    enabled: open,
  });

  const form = useForm<AnimalBatchChangeData>({
    resolver: zodResolver(animalBatchChangeSchema),
    defaultValues: { newBatchId: "", notes: "" },
  });
  const newBatchId = useWatch({ control: form.control, name: "newBatchId" });

  // Ao fechar, o diálogo volta ao estado inicial (abre limpo na próxima vez).
  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ newBatchId: "", notes: "" });
      batches.clearSearch();
    }
    onOpenChange(next);
  }

  function handleSubmit(data: AnimalBatchChangeData) {
    const selectedItem = batches.items.find(
      (item) => item.value === data.newBatchId,
    );
    onConfirm(data.newBatchId, selectedItem?.label, data.notes);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar Lote do Animal</DialogTitle>
          <DialogDescription>
            Selecione o lote de destino para o animal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            name="newBatchId"
            control={form.control}
            label="Lote de Destino"
            required
            render={({ field, fieldState, id }) => (
              <SearchCombobox
                id={id}
                field={field}
                fieldState={fieldState}
                items={batches.items}
                onInputValueChange={batches.search}
                placeholder="Buscar lote..."
                emptyMessage="Nenhum lote disponível"
              />
            )}
          />

          <StockingNotice
            request={
              newBatchId && animalId
                ? { batchId: newBatchId, animalIds: [animalId] }
                : null
            }
          />

          <FormField
            name="notes"
            control={form.control}
            label="Observação"
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Observação sobre a troca de lote..."
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
