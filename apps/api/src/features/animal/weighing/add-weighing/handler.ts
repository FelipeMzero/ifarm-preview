import type { WeighingCreateData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../commitments";
import { resolveEventDate } from "../../eventDate";
import { recomputeCurrentWeight } from "../shared";

// Pesagem avulsa registrada na hora (o peso atual passa a ser o da mais recente).
export async function addWeighing(animalId: string, data: WeighingCreateData) {
  const weighedAt = await resolveEventDate(animalId, data.date);

  await prisma.$transaction(async (tx) => {
    await assertNoConflicts(tx, [animalId], {
      kind: "record",
      type: "weighing",
    });
    await tx.animalWeighing.create({
      data: { animalId, weight: data.weightKg, notes: data.notes, weighedAt },
    });
    await recomputeCurrentWeight(tx, animalId);
  });
}
