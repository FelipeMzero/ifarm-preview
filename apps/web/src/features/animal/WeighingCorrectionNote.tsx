import { type AnimalWeighing, formatDateTime, formatDay } from "@ifarm/shared";
import { formatKg } from "./format";

// Indica, abaixo do peso, que a pesagem foi corrigida e qual era o peso lançado originalmente; a dica de tela
// traz a linha do tempo das versões anteriores.
export function WeighingCorrectionNote({
  weighing,
}: {
  weighing: AnimalWeighing;
}) {
  if (!weighing.correctedAt) return null;

  const original = weighing.previousVersions.at(-1);
  const was =
    original && original.weightKg !== weighing.weightKg ? original : null;

  return (
    <div
      className="text-xs text-muted-foreground"
      title={[
        `Corrigida em ${formatDay(weighing.correctedAt)}`,
        ...weighing.previousVersions.map(
          (v) =>
            `Lançada em ${formatDay(v.recordedAt)}: ${formatKg(v.weightKg)}, ${formatDateTime(v.date)}`,
        ),
      ].join("\n")}
    >
      {was ? `corrigido (era ${formatKg(was.weightKg)})` : "corrigido"}
    </div>
  );
}
