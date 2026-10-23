import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";
import { SelectField } from "@/components/our/SelectField";
import { FIELD_LIMITS } from "@ifarm/shared";
import type { PlanFieldsProps } from "../types";
import { DOSE_LABELS, type HealthDoseType } from "./config";

const DOSE_ITEMS = (Object.keys(DOSE_LABELS) as HealthDoseType[]).map(
  (value) => ({ value, label: DOSE_LABELS[value] }),
);

// Produto, responsável, carência e regra de dose são do procedimento (iguais para
// todos os animais); no registro, cada animal só recebe a dose aplicada e observação.
export default function HealthPlanFields({
  index,
  control,
  options,
}: PlanFieldsProps) {
  const doseType = useWatch({ control, name: `steps.${index}.doseType` });

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
            name={`steps.${index}.withdrawalEndDate`}
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
          name={`steps.${index}.doseType`}
          control={control}
          label="Dose"
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value || "NONE"}
              onValueChange={field.onChange}
              items={DOSE_ITEMS}
              className="w-full"
            />
          )}
        />
        {(doseType === "FIXED" || doseType === "PER_WEIGHT") && (
          <FieldRow cols={doseType === "PER_WEIGHT" ? 2 : 1}>
            <FormField
              name={`steps.${index}.doseMl`}
              control={control}
              label={
                doseType === "FIXED" ? "Dose por animal (ml)" : "Dose (ml)"
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
            {doseType === "PER_WEIGHT" && (
              <FormField
                name={`steps.${index}.doseWeightKg`}
                control={control}
                label="A cada (kg)"
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
                    placeholder="Ex: 50"
                  />
                )}
              />
            )}
          </FieldRow>
        )}
      </FieldRow>
    </div>
  );
}
