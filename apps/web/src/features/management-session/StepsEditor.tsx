"use client";

import { useFieldArray, useFormState, type Control } from "react-hook-form";
import { ArrowDown, ArrowUp, CircleAlert, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  REPEATABLE_STEP_TYPES,
  STEP_TYPE_LABELS,
  STEP_TYPES,
  type StepType,
} from "@ifarm/shared";
import type { PlanFormData } from "./schema";
import { type ManagementOptions } from "@ifarm/shared";
import { clientStepModule } from "./steps/registry";

type StepsEditorProps = {
  control: Control<PlanFormData>;
  options: ManagementOptions;
  disabled?: boolean;
};

export function StepsEditor({ control, options, disabled }: StepsEditorProps) {
  const { fields, insert, remove, swap } = useFieldArray({
    control,
    name: "steps",
  });
  const { errors } = useFormState({ control, name: "steps" });

  const hasBatch = fields.at(-1)?.type === "batch";
  const used = new Set(fields.map((f) => f.type));

  function add(type: StepType) {
    const defaults = clientStepModule(type).planDefaults?.() ?? {};
    // A apartação é sempre a última; as demais entram antes dela.
    const index =
      type === "batch" || !hasBatch ? fields.length : fields.length - 1;
    insert(index, { type, ...defaults });
  }

  const stepsError = errors.steps?.message ?? errors.steps?.root?.message;

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Nenhum manejo adicionado.
        </div>
      ) : (
        <ol className="space-y-2">
          {fields.map((field, index) => {
            const mod = clientStepModule(field.type);
            const Icon = mod.icon;
            const isBatch = field.type === "batch";
            const lastMovable = hasBatch
              ? fields.length - 2
              : fields.length - 1;
            const PlanFields = mod.PlanFields;
            const stepErrors = errors.steps?.[index];
            return (
              <li
                key={field.id}
                className="rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">
                    {index + 1}
                  </span>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {STEP_TYPE_LABELS[field.type]}
                      {stepErrors && (
                        <CircleAlert className="size-4 text-destructive" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mod.description}
                    </p>
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Mover para cima"
                        disabled={isBatch || index === 0}
                        onClick={() => swap(index, index - 1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Mover para baixo"
                        disabled={isBatch || index >= lastMovable}
                        onClick={() => swap(index, index + 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Remover manejo"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {PlanFields && (
                  <div className="border-t border-border p-3">
                    <PlanFields
                      index={index}
                      control={control}
                      options={options}
                      disabled={disabled}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {stepsError && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlert className="size-4" /> {stepsError}
        </p>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2">
          {STEP_TYPES.map((type) => {
            const Icon = clientStepModule(type).icon;
            const blocked =
              used.has(type) && !REPEATABLE_STEP_TYPES.includes(type);
            return (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                disabled={blocked}
                onClick={() => add(type)}
              >
                <Plus className="size-3.5" />
                <Icon className="size-4" />
                {STEP_TYPE_LABELS[type]}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
