"use client";

import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";
import { SelectField } from "@/components/our/SelectField";
import { FIELD_LIMITS } from "@/lib/field-limits";
import type { PlanFieldsProps } from "../types";
import { PRICING_LABELS, type HealthPricingType } from "./config";

const PRICING_ITEMS = [
  { value: "", label: "Não informado" },
  ...(Object.keys(PRICING_LABELS) as HealthPricingType[]).map((value) => ({
    value,
    label: PRICING_LABELS[value],
  })),
];

// Produto, responsável, carência e cobrança são do procedimento (iguais para todos os
// animais); no registro, cada animal só recebe custo individual e observação.
export default function HealthPlanFields({
  index,
  control,
  options,
}: PlanFieldsProps) {
  const pricingType = useWatch({ control, name: `steps.${index}.pricingType` });
  const priced = pricingType === "FIXED" || pricingType === "PER_WEIGHT";

  return (
    <div className="space-y-4">
      <FieldRow cols={2}>
        <FormField
          name={`steps.${index}.typeId`}
          control={control}
          label="Tipo"
          required
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={options.healthTypes.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              placeholder="Selecione..."
              className="w-full"
            />
          )}
        />
        <FormField
          name={`steps.${index}.title`}
          control={control}
          label="Produto / descrição"
          render={({ field, id }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              maxLength={FIELD_LIMITS.managementSession.healthTitle}
              placeholder="Ex: Febre aftosa, Ivermectina 1%"
            />
          )}
        />
      </FieldRow>

      <FieldRow cols={2}>
        <FormField
          name={`steps.${index}.veterinarianId`}
          control={control}
          label="Veterinário"
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={[
                { value: "", label: "Nenhum" },
                ...options.people.map((p) => ({ value: p.id, label: p.name })),
              ]}
              searchable
              searchPlaceholder="Buscar pessoa..."
              className="w-full"
            />
          )}
        />
        <FieldRow cols={2}>
          <FormField
            name={`steps.${index}.withdrawalUntil`}
            control={control}
            label="Carência até"
            render={({ field, id }) => (
              <Input {...field} value={field.value ?? ""} id={id} type="date" />
            )}
          />
          <FormField
            name={`steps.${index}.nextDueDate`}
            control={control}
            label="Próxima dose"
            render={({ field, id }) => (
              <Input {...field} value={field.value ?? ""} id={id} type="date" />
            )}
          />
        </FieldRow>
      </FieldRow>

      <FieldRow cols={2}>
        <FormField
          name={`steps.${index}.pricingType`}
          control={control}
          label="Cobrança"
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={PRICING_ITEMS}
              className="w-full"
            />
          )}
        />
        {priced && (
          <FormField
            name={`steps.${index}.unitPrice`}
            control={control}
            label={
              pricingType === "PER_WEIGHT"
                ? "Valor por kg (R$)"
                : "Valor por animal (R$)"
            }
            required
            render={({ field, id }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id={id}
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
              />
            )}
          />
        )}
      </FieldRow>
    </div>
  );
}
