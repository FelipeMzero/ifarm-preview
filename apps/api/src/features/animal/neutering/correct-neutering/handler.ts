import {
  REQUIRED_TECHNIQUE_MESSAGE,
  toLocalDateTime,
  type NeuteringCorrectionData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNotBeforeBirth, assertNotFuture } from "../../eventDate";
import { sessionDateLock } from "../../rules";
import { fieldError } from "../../shared";
import {
  findActiveNeutering,
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../shared";

// Corrige técnica, data (só castrações avulsas) e observação; guarda os valores originais.
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

  let neuteredAt: Date | undefined;
  if (data.date) {
    neuteredAt = toLocalDateTime(data.date);
    assertNotFuture(neuteredAt);
    await assertNotBeforeBirth(animalId, neuteredAt);
  }

  // Dois valores originais (data e técnica, que pode ser nula): a marca da primeira
  // correção é correctedAt, não o original vazio (ver keepsOriginal).
  const firstCorrection = neutering.correctedAt === null;

  await prisma.animalNeutering.update({
    where: { id: neutering.id },
    data: {
      techniqueId: data.techniqueId,
      notes: data.notes,
      ...(neuteredAt ? { neuteredAt } : {}),
      // Guarda os valores lançados originalmente só na primeira correção.
      ...(firstCorrection
        ? {
            originalNeuteredAt: neutering.neuteredAt,
            originalTechniqueId: neutering.techniqueId,
          }
        : {}),
      correctedAt: new Date(),
    },
  });
}
