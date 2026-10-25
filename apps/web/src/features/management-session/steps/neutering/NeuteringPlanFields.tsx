import { useWatch } from "react-hook-form";
import { FormField } from "@/components/our/FormField";
import { SelectField } from "@/components/our/SelectField";
import { techniqueItems } from "@/features/neutering-technique/items";
import type { PlanFieldsProps } from "../types";

// Técnica prevista: vem pré-selecionada no registro de cada animal, que pode trocá-la.
export function NeuteringPlanFields({
  index,
  control,
  options,
}: PlanFieldsProps) {
  const [techniqueId, techniqueName] = useWatch({
    control,
    name: [
      `steps.${index}.suggestedTechniqueId`,
      `steps.${index}.suggestedTechniqueName`,
    ],
  });

  return (
    <FormField
      name={`steps.${index}.suggestedTechniqueId`}
      control={control}
      label="Técnica prevista"
      render={({ field, id }) => (
        <SelectField
          id={id}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          items={techniqueItems(options.neuteringTechniques, {
            current: { id: techniqueId ?? null, name: techniqueName ?? null },
            optional: true,
          })}
          className="w-full max-w-80"
        />
      )}
    />
  );
}
