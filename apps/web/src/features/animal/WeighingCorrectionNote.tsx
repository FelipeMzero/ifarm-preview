import { type AnimalWeighing } from "@ifarm/shared";
import { formatDate, formatKg } from "./format";

// Indica, abaixo do peso, que a pesagem foi corrigida e qual era o valor original.
export function WeighingCorrectionNote({
  weighing,
}: {
  weighing: AnimalWeighing;
}) {
  if (!weighing.correctedAt) return null;

  return (
    <div
      className="text-xs text-muted-foreground"
      title={`Corrigida em ${formatDate(weighing.correctedAt)}`}
    >
      {weighing.originalWeightKg != null
        ? `corrigido (era ${formatKg(weighing.originalWeightKg)})`
        : "corrigido"}
    </div>
  );
}
