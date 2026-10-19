"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  SearchCombobox,
  SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { StockingNotice } from "@/features/area/StockingNotice";
import { batchClient } from "@/lib/clients";
import { ApiError } from "@ifarm/shared";

const reopenSchema = z.object({
  areaId: z.string().min(1, "Selecione a área do lote."),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batch.notes,
      `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
    )
    .optional(),
});

type ReopenData = z.infer<typeof reopenSchema>;

type PreviousArea = { id: string; name: string; available: boolean };

interface BatchReopenDialogProps {
  batch: { id: string; name: string } | null;
  propertyId?: string;
  onOpenChange: (open: boolean) => void;
  onReopened: () => void;
}

// Reativa um lote encerrado. Ao encerrar, a área foi liberada; se ela continua livre
// vem sugerida, senão o usuário escolhe outra área disponível.
export function BatchReopenDialog({
  batch,
  propertyId,
  onOpenChange,
  onReopened,
}: BatchReopenDialogProps) {
  const [areaItems, setAreaItems] = useState<SearchComboboxItem[]>([]);
  const [previousArea, setPreviousArea] = useState<PreviousArea | null>(null);
  const [loading, setLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ReopenData>({
    resolver: zodResolver(reopenSchema),
    defaultValues: { areaId: "", notes: "" },
  });
  const areaId = form.watch("areaId");

  const loadAreas = useCallback(
    async (q: string) => {
      try {
        const result = await batchClient.getAreasForBatch(q, propertyId);
        setAreaItems(result.data.map((a) => ({ value: a.id, label: a.name })));
        return result.data;
      } catch (err) {
        console.error("Erro ao carregar áreas para reativar o lote:", err);
        setAreaItems([]);
        return [];
      }
    },
    [propertyId],
  );

  const handleSearchAreas = useCallback(
    (query: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => loadAreas(query), 300);
    },
    [loadAreas],
  );

  const batchId = batch?.id;

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      form.reset({ areaId: "", notes: "" });
      setPreviousArea(null);
      try {
        const [detail, available] = await Promise.all([
          batchClient.getBatch(batchId!),
          loadAreas(""),
        ]);
        if (cancelled) return;
        // Histórico vem da entrada mais recente para a mais antiga.
        const last = detail.areaHistory[0]?.area;
        if (last) {
          const isFree = available.some((a) => a.id === last.id);
          setPreviousArea({ ...last, available: isFree });
          if (isFree) form.setValue("areaId", last.id);
        }
      } catch {
        if (!cancelled)
          toast.error("Não foi possível carregar os dados do lote.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [batchId, form, loadAreas]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  async function handleSubmit(data: ReopenData) {
    if (!batch) return;
    try {
      await batchClient.reopenBatch(batch.id, data);
      toast.success(`Lote "${batch.name}" reativado.`);
      onOpenChange(false);
      onReopened();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) =>
          form.setError(field as keyof ReopenData, { type: "server", message }),
        );
      } else {
        toast.error((error as Error).message);
      }
    }
  }

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
                items={areaItems}
                onInputValueChange={handleSearchAreas}
                placeholder={
                  loading ? "Carregando..." : "Buscar área disponível..."
                }
                emptyMessage="Nenhuma área disponível"
              />
            )}
          />

          <StockingNotice
            request={areaId && batch ? { areaId, batchIds: [batch.id] } : null}
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || loading}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reativar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
