import {
  REQUIRED_TECHNIQUE_MESSAGE,
  type NeuteringCorrectionData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../../lib/errors";
import { animalStays, timeZoneAt } from "../../../property/time-zone.public";
import { resolveEventDateIn } from "../../event-date";
import { sessionDateLock } from "../../rules";
import { fieldError } from "../../shared";
import { findActiveNeutering } from "../shared";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../technique.public";

// Corrige técnica, data (só castrações avulsas) e observação: a castração não é alterada; é
// cancelada e substituída por outra, que aponta para ela.
export async function correctNeutering(
  animalId: string,
  neuteringId: string,
  data: NeuteringCorrectionData,
) {
  const neutering = await findActiveNeutering(animalId, neuteringId);

  // Só pode ficar sem técnica o registro lançado sem ela (ex.: animal que chegou castrado).
  if (neutering.techniqueId && !data.techniqueId) {
    throw fieldError("techniqueId", REQUIRED_TECHNIQUE_MESSAGE);
  }

  if (
    !(await isValidNeuteringTechnique(data.techniqueId, neutering.techniqueId))
  ) {
    throw fieldError("techniqueId", INVALID_TECHNIQUE_MESSAGE);
  }

  const dateLock = sessionDateLock(neutering, data.date, "castração");
  if (dateLock) throw fieldError("date", dateLock);

  // A data nova vale no fuso da propriedade onde a castração aconteceu.
  let neuteredAt: Date | undefined;
  if (data.date) {
    const { stays, current } = await animalStays(animalId);
    const timeZone = timeZoneAt(stays, neutering.neuteredAt, current);
    neuteredAt = await resolveEventDateIn(animalId, data.date, timeZone);
  }

  await prisma.$transaction(async (tx) => {
    // Condicional para uma correção concorrente não substituir a mesma castração.
    const cancelled = await tx.animalNeutering.updateMany({
      where: { id: neutering.id, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    if (cancelled.count !== 1) {
      throw new NotFoundError("Castração não encontrada.");
    }

    await tx.animalNeutering.create({
      data: {
        animalId,
        managementId: neutering.managementId,
        replacesId: neutering.id,
        techniqueId: data.techniqueId,
        notes: data.notes,
        neuteredAt: neuteredAt ?? neutering.neuteredAt,
      },
    });
  });
}
