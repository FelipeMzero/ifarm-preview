"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
import {
  SearchCombobox,
  SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { BatchAreaChangeData, batchAreaChangeSchema } from "./schema";
import { batchClient } from "@/lib/clients";
import { StockingNotice } from "@/features/area/StockingNotice";

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
  const [areaItems, setAreaItems] = useState<SearchComboboxItem[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<BatchAreaChangeData>({
    resolver: zodResolver(batchAreaChangeSchema),
    defaultValues: { newAreaId: "", description: "" },
  });
  const newAreaId = form.watch("newAreaId");

  const loadAreas = useCallback(
    async (q: string) => {
      try {
        const result = await batchClient.getAreasForBatch(q, propertyId);
        setAreaItems(
          result.data
            .filter((a) => a.id !== currentAreaId)
            .map((a) => ({ value: a.id, label: a.name })),
        );
      } catch (err) {
        console.error("Erro ao carregar áreas para troca de lote:", err);
        setAreaItems([]);
      }
    },
    [currentAreaId, propertyId],
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
    if (open) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      form.reset({ newAreaId: "", description: "" });
      loadAreas("");
    }
  }, [open, loadAreas, form]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      form.reset({ newAreaId: "", description: "" });
      loadAreas("");
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(data: BatchAreaChangeData) {
    const selectedItem = areaItems.find(
      (item) => item.value === data.newAreaId,
    );
    onConfirm(data, selectedItem?.label);
    onOpenChange(false);
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
                items={areaItems}
                onInputValueChange={handleSearchAreas}
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
              onClick={() => onOpenChange(false)}
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
