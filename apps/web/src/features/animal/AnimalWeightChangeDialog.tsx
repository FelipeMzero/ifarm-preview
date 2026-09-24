"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { animalWeightChangeSchema, AnimalWeightChangeData } from "./schema";

interface AnimalWeightChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string, notes?: string) => void;
}

export function AnimalWeightChangeDialog({
  open,
  onOpenChange,
  onConfirm,
}: AnimalWeightChangeDialogProps) {
  const form = useForm<AnimalWeightChangeData>({
    resolver: zodResolver(animalWeightChangeSchema),
    defaultValues: { value: "", notes: "" },
  });

  useEffect(() => {
    if (open) form.reset({ value: "", notes: "" });
  }, [open, form]);

  function handleSubmit(data: AnimalWeightChangeData) {
    onConfirm(data.value, data.notes);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pesagem</DialogTitle>
          <DialogDescription>Informe o novo peso do animal.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            name="value"
            control={form.control}
            label="Novo Peso (kg)"
            required
            render={({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 350"
              />
            )}
          />

          <FormField
            name="notes"
            control={form.control}
            label="Observação"
            render={({ field, id }) => (
              <Textarea
                {...field}
                id={id}
                placeholder="Observação sobre a pesagem..."
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
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
