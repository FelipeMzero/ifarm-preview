"use client";

import { UseFormReturn } from "react-hook-form";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/our/FormField";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AreaFormData } from "./schema";
import { AreaRow } from "./services";

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArea: AreaRow | null;
  form: UseFormReturn<AreaFormData>;
  onSubmit: (data: AreaFormData) => Promise<void>;
  onCancel: () => void;
  hectaresWarning: string | null;
  onRedraw?: () => void;
  polygonPointsCount?: number;
  calculatedHectares?: number;
}

export function AreaForm({
  open,
  onOpenChange,
  editingArea,
  form,
  onSubmit,
  onCancel,
  hectaresWarning,
  onRedraw,
  polygonPointsCount = 0,
  calculatedHectares = 0,
}: AreaFormProps) {
  const hasPolygon = polygonPointsCount >= 3 || form.watch("polygon") != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent showOverlay={false} className="sm:max-w-md flex flex-col h-full p-0 shadow-2xl border-l z-[1000]">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle>
            {editingArea ? "Editar Área de Pastagem" : "Nova Área de Pastagem"}
          </SheetTitle>
          <SheetDescription>
            {editingArea
              ? "Ajuste os contornos no mapa arrastando os vértices ou altere os dados abaixo."
              : "Defina o contorno no mapa e informe os dados cadastrais abaixo."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contorno no Mapa
                </span>
                {onRedraw && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRedraw}
                    className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="size-3" /> Redesenhar no Mapa
                  </Button>
                )}
              </div>

              {hasPolygon ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">
                    {polygonPointsCount > 0 ? `${polygonPointsCount} vértices definidos` : "Polígono cadastrado"}
                  </span>
                  {calculatedHectares > 0 && (
                    <span className="font-medium text-xs text-emerald-600 dark:text-emerald-400">
                      Área no mapa: {calculatedHectares.toFixed(2)} ha
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Nenhum polígono desenhado. Desenhe a área diretamente sobre o mapa.
                </p>
              )}
            </div>

            <FormField
              name="name"
              control={form.control}
              label="Nome da Área"
              required
              render={({ field }) => (
                <Input {...field} placeholder="Ex: Piquete 01, Invernada Grande" />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="hectares"
                control={form.control}
                label="Área (Hectares)"
                required
                warning={hectaresWarning}
                render={({ field }) => (
                  <Input {...field} type="number" step="any" placeholder="Ex: 12.50" />
                )}
              />

              <FormField
                name="stockingRate"
                control={form.control}
                label="Lotação (UA/ha)"
                required
                render={({ field }) => (
                  <Input {...field} type="number" step="any" placeholder="Ex: 1.80" />
                )}
              />
            </div>

            <FormField
              name="notes"
              control={form.control}
              label="Observação"
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Ex: Capim-braquiarão, solo adubado, proximidade com bebedouro..."
                  className="resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t bg-background p-4 shrink-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
