import { Prisma } from "@ifarm/db";
import type { AnimalWeighing } from "@ifarm/db/client";
import { effectiveWeighing } from "../management-session/effective";

type Tx = Prisma.TransactionClient;

export function toWeighingDto(w: AnimalWeighing) {
  return {
    id: w.id,
    date: w.weighedAt.toISOString(),
    weightKg: w.weight.toNumber(),
    notes: w.notes,
    fromSession: w.managementId != null,
    correctedAt: w.correctedAt?.toISOString() ?? null,
    originalWeightKg: w.originalWeight?.toNumber() ?? null,
  };
}

// Pesagens válidas (não canceladas), da mais antiga para a mais recente.
export function sortWeighings<T extends { date: string; id: number }>(
  list: T[],
): T[] {
  return list.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

// Recalcula o peso atual (campo desnormalizado) a partir da pesagem válida mais recente.
export async function recomputeCurrentWeight(tx: Tx, animalId: string) {
  const latest = await tx.animalWeighing.findFirst({
    where: { animalId, cancelledAt: null, ...effectiveWeighing },
    orderBy: [{ weighedAt: "desc" }, { id: "desc" }],
  });

  await tx.animal.update({
    where: { id: animalId },
    data: { currentWeight: latest?.weight ?? null },
  });
}
