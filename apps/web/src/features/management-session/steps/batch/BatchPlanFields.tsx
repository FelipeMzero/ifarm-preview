"use client";

import { Controller } from "react-hook-form";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/our/SelectField";
import type { PlanFieldsProps } from "../types";

// Lotes que aparecem como atalho na apartação; qualquer outro lote ativo continua
// disponível no registro. Busca + etiquetas em vez de uma lista de todos os lotes,
// que ficaria enorme em propriedades com muitos lotes.
export default function BatchPlanFields({
  index,
  control,
  options,
  disabled,
}: PlanFieldsProps) {
  const names = new Map(options.batches.map((b) => [b.id, b.name]));

  return (
    <Controller
      control={control}
      name={`steps.${index}.suggestedBatchIds`}
      render={({ field }) => {
        const selected = field.value ?? [];
        const available = options.batches.filter(
          (b) => !selected.includes(b.id),
        );
        return (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Lotes sugeridos
            </p>
            {options.batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lote ativo na propriedade.
              </p>
            ) : (
              !disabled && (
                <SelectField
                  value=""
                  onValueChange={(id) => {
                    if (id) field.onChange([...selected, id]);
                  }}
                  items={available.map((b) => ({ value: b.id, label: b.name }))}
                  placeholder="Adicionar lote sugerido..."
                  searchable
                  searchPlaceholder="Buscar lote..."
                  className="w-full max-w-100"
                />
              )
            )}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((id) => (
                  <Badge key={id} variant="secondary" className="gap-1 pr-1">
                    {names.get(id) ?? "Lote encerrado"}
                    {!disabled && (
                      <button
                        type="button"
                        title="Remover lote sugerido"
                        className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                        onClick={() =>
                          field.onChange(selected.filter((s) => s !== id))
                        }
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
