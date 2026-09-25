"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import FieldRow from "@/components/our/FieldRow";
import {
  animalNeuteringSchema,
  animalRecastrationSchema,
  AnimalNeuteringData,
} from "./schema";

interface AnimalNeuteringDialogProps {
  open: boolean;
  isRecastration?: boolean;
  lastNeuteredAt?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: AnimalNeuteringData) => void;
}

const today = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd no fuso local

export function AnimalNeuteringDialog({
  open,
  isRecastration = false,
  lastNeuteredAt,
  onOpenChange,
  onConfirm,
}: AnimalNeuteringDialogProps) {
  const form = useForm<AnimalNeuteringData>({
    resolver: zodResolver(
      isRecastration ? animalRecastrationSchema : animalNeuteringSchema,
    ),
    defaultValues: { date: today(), method: "", notes: "" },
  });

  useEffect(() => {
    if (open) form.reset({ date: today(), method: "", notes: "" });
  }, [open, form]);

  function handleSubmit(data: AnimalNeuteringData) {
    onConfirm(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRecastration ? "Registrar Recastração" : "Registrar Castração"}
          </DialogTitle>
          <DialogDescription>
            {isRecastration
              ? "Informe os dados do novo procedimento."
              : "Informe os dados da castração realizada no animal."}
          </DialogDescription>
        </DialogHeader>

        {isRecastration && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="font-medium">Este animal já foi castrado</p>
              <p className="text-muted-foreground">
                {lastNeuteredAt
                  ? `Há uma castração registrada em ${new Date(lastNeuteredAt).toLocaleDateString("pt-BR")}. `
                  : "Já existe uma castração registrada. "}
                Registre uma nova apenas se o procedimento precisou ser
                refeito, e informe o motivo.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FieldRow cols={2}>
            <FormField
              name="date"
              control={form.control}
              label="Data"
              required
              render={({ field, id }) => (
                <Input {...field} id={id} type="date" max={today()} />
              )}
            />

            <FormField
              name="method"
              control={form.control}
              label="Método"
              render={({ field, id }) => (
                <Input {...field} id={id} placeholder="Ex: Cirúrgico" />
              )}
            />
          </FieldRow>

          <FormField
            name="notes"
            control={form.control}
            label={isRecastration ? "Motivo" : "Observação"}
            required={isRecastration}
            render={({ field, id }) => (
              <Textarea
                {...field}
                id={id}
                placeholder={
                  isRecastration
                    ? "Motivo da recastração..."
                    : "Observação sobre a castração..."
                }
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
              {isRecastration ? "Confirmar Recastração" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
