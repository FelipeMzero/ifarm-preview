import { instantToZonedIso } from "@ifarm/shared";
import { prisma, Prisma } from "@ifarm/db";
import type { AnimalWeighing } from "@ifarm/db/client";
import { NotFoundError } from "../../../lib/errors";
import { effectiveWeighing } from "../../management-session/effective";
import type { ZoneOf } from "../../property/time-zone";
import { toZonedIso } from "../../property/time-zone";

type Tx = Prisma.TransactionClient;

// A data da pesagem vai no fuso da propriedade onde ela aconteceu (`zoneOf`).
export function toWeighingDto(w: AnimalWeighing, zoneOf: ZoneOf) {
  return {
    id: w.id,
    date: instantToZonedIso(w.weighedAt, zoneOf(w.weighedAt)),
    weightKg: w.weight.toNumber(),
    notes: w.notes,
    fromSession: w.managementId != null,
    correctedAt: w.correctedAt
      ? toZonedIso(w.correctedAt, zoneOf(w.correctedAt))
      : null,
    originalWeightKg: w.originalWeight?.toNumber() ?? null,
  };
}

// Pesagens válidas (não canceladas), da mais antiga para a mais recente.
export function sortWeighings<T extends { date: string; id: number }>(
  list: T[],
): T[] {
  // Pelo instante: as datas podem vir com deslocamentos diferentes.
  return list.sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date) || a.id - b.id,
  );
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

// Pesagem válida do animal (corrigir e excluir); erro 404 se não existir.
export async function findActiveWeighing(animalId: string, weighingId: string) {
  const numericId = Number(weighingId);
  const weighing = Number.isInteger(numericId)
    ? await prisma.animalWeighing.findFirst({
        where: {
          id: numericId,
          animalId,
          cancelledAt: null,
          ...effectiveWeighing,
        },
      })
    : null;
  if (!weighing) throw new NotFoundError("Pesagem não encontrada.");
  return weighing;
}
