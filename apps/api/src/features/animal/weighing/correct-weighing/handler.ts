import { toLocalDateTime, type WeighingCorrectionData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNotBeforeBirth, assertNotFuture } from "../../eventDate";
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

  let weighedAt: Date | undefined;
  if (data.date) {
    weighedAt = toLocalDateTime(data.date);
    assertNotFuture(weighedAt);
    await assertNotBeforeBirth(animalId, weighedAt);
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
