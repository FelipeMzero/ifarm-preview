import type { WeighingCorrectionData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { animalStays, timeZoneAt } from "../../../property/time-zone";
import { resolveEventDateIn } from "../../event-date";
import { keepsOriginal, sessionDateLock } from "../../rules";
import { fieldError } from "../../shared";
import { findActiveWeighing, recomputeCurrentWeight } from "../shared";

// Corrige peso, data (só pesagens avulsas) e observação; guarda o peso original.
export async function correctWeighing(
  animalId: string,
  weighingId: string,
  data: WeighingCorrectionData,
) {
  const weighing = await findActiveWeighing(animalId, weighingId);

  const dateLock = sessionDateLock(weighing, data.date, "pesagem");
  if (dateLock) throw fieldError("date", dateLock);

  // A data nova vale no fuso da propriedade onde a pesagem aconteceu.
  let weighedAt: Date | undefined;
  if (data.date) {
    const { stays, current } = await animalStays(animalId);
    const timeZone = timeZoneAt(stays, weighing.weighedAt, current);
    weighedAt = await resolveEventDateIn(animalId, data.date, timeZone);
  }

  const weightChanged = !weighing.weight.equals(data.weightKg);

  await prisma.$transaction(async (tx) => {
    await tx.animalWeighing.update({
      where: { id: weighing.id },
      data: {
        weight: data.weightKg,
        notes: data.notes,
        ...(weighedAt ? { weighedAt } : {}),
        // Guarda o valor lançado originalmente só na primeira correção de peso.
        ...(keepsOriginal(weightChanged, weighing.originalWeight)
          ? { originalWeight: weighing.weight }
          : {}),
        correctedAt: new Date(),
      },
    });

    await recomputeCurrentWeight(tx, animalId);
  });
}
