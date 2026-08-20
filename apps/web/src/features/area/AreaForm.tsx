"use client";

import { FIELD_LIMITS } from "@/lib/field-limits";import { UseFormReturn } from "react-hook-form";
import { Hexagon, Loader2, MapPin, Pencil, Ruler } from "lucide-react";
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
import FieldRow from "@/components/our/FieldRow";
import { FormActionBar } from "@/components/our/FormActionBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  container?: HTMLElement | null;
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
  container,
}: AreaFormProps) {
  const hasPolygon = polygonPointsCount >= 3 || form.watch("polygon") != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        showOverlay={false}
        className="border-l border-border"
        onPointerDownOutside={(e) => e.preventDefault()}
        container={container}
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>
            {editingArea ? "Editar Área de Pastagem" : "Nova Área de Pastagem"}
          </SheetTitle>
          <SheetDescription>
            Ajuste os contornos no mapa e preencha os dados abaixo.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pt-1">

            <Card className="bg-muted/50 shrink-0">
              <CardHeader className="flex flex-row items-center justify-center gap-2 pb-2">
                <MapPin className="size-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Contorno no Mapa
                </span>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Ruler className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{calculatedHectares.toFixed(2)} ha</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hexagon className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{polygonPointsCount} vértices</span>
                </div>
              </CardContent>
            </Card>

            <FieldRow>
              <FormField
                name="name"
                control={form.control}
                label="Nome da Área"
                required
                render={({ field }) => (
                  <Input {...field} maxLength={FIELD_LIMITS.area.name} placeholder="Ex: Piquete 01, Invernada Grande" />
                )}
              />
            </FieldRow>

            <FieldRow cols={2}>
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
            </FieldRow>

            <FieldRow>
              <FormField
                name="notes"
                control={form.control}
                label="Observação"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    maxLength={FIELD_LIMITS.area.notes}
                    placeholder="Ex: Capim-braquiarão, solo adubado, proximidade com bebedouro..."
                    className="resize-none"
                    rows={3}
                  />
                )}
              />
            </FieldRow>

            <FormActionBar padding={6} className="mt-auto">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </FormActionBar>

            
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
