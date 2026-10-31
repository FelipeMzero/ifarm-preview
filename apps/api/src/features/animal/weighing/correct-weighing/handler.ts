import type { WeighingCorrectionData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../../lib/errors";
import { animalStays, timeZoneAt } from "../../../property/time-zone.public";
import { resolveEventDateIn } from "../../event-date";
import { sessionDateLock } from "../../rules";
import { fieldError } from "../../shared";
import { findActiveWeighing } from "../shared";
import { recomputeCurrentWeight } from "../current-weight.public";

// Corrige peso, data (só pesagens avulsas) e observação: a pesagem não é alterada; é cancelada e
// substituída por outra, que aponta para ela.
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

  await prisma.$transaction(async (tx) => {
    // Condicional para uma correção concorrente não substituir a mesma pesagem.
    const cancelled = await tx.animalWeighing.updateMany({
      where: { id: weighing.id, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    if (cancelled.count !== 1) {
      throw new NotFoundError("Pesagem não encontrada.");
    }

    await tx.animalWeighing.create({
      data: {
        animalId,
        managementId: weighing.managementId,
        replacesId: weighing.id,
        weight: data.weightKg,
        notes: data.notes,
        weighedAt: weighedAt ?? weighing.weighedAt,
      },
    });

    await recomputeCurrentWeight(tx, animalId);
  });
}
