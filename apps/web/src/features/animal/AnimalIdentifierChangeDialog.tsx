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
import {
  animalTagChangeSchema,
  animalRfidChangeSchema,
  AnimalTagChangeData,
  AnimalRfidChangeData,
} from "./schema";

type IdentifierKind = "tag" | "rfid";

interface AnimalIdentifierChangeDialogProps {
  kind: IdentifierKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string, notes?: string) => void;
}

const COPY: Record<
  IdentifierKind,
  { title: string; description: string; label: string; placeholder: string }
> = {
  tag: {
    title: "Trocar Brinco",
    description: "Informe o novo brinco do animal.",
    label: "Novo Brinco",
    placeholder: "Ex: MS-001234",
  },
  rfid: {
    title: "Trocar RFID",
    description: "Informe o novo RFID do animal.",
    label: "Novo RFID",
    placeholder: "Ex: 900082000169813",
  },
};

export function AnimalIdentifierChangeDialog({
  kind,
  open,
  onOpenChange,
  onConfirm,
}: AnimalIdentifierChangeDialogProps) {
  const copy = COPY[kind];
  const schema =
    kind === "tag" ? animalTagChangeSchema : animalRfidChangeSchema;

  const form = useForm<AnimalTagChangeData | AnimalRfidChangeData>({
    resolver: zodResolver(schema),
    defaultValues: { value: "", notes: "" },
  });

  useEffect(() => {
    if (open) form.reset({ value: "", notes: "" });
  }, [open, form]);

  function handleSubmit(data: AnimalTagChangeData | AnimalRfidChangeData) {
    onConfirm(data.value ?? "", data.notes);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            name="value"
            control={form.control}
            label={copy.label}
            required={kind === "tag"}
            render={({ field, id }) => (
              <Input {...field} id={id} placeholder={copy.placeholder} />
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
                placeholder="Observação sobre a troca..."
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
