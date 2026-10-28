import type { NeuteringCreateData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../../lib/errors";
import { assertNoConflicts } from "../../commitments";
import { resolveEventDate } from "../../event-date";
import { fieldError } from "../../shared";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../shared";

// Castração avulsa registrada na hora. Se o animal já é castrado, é uma recastração
// (não é rotineira): o motivo é obrigatório.
export async function addNeutering(
  animalId: string,
  data: NeuteringCreateData,
) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { neutered: true },
  });
  if (!animal) throw new NotFoundError("Animal não encontrado.");
  if (animal.neutered && !data.notes) {
    throw fieldError("notes", "Informe o motivo da recastração.");
  }

  if (!(await isValidNeuteringTechnique(data.techniqueId))) {
    throw fieldError("techniqueId", INVALID_TECHNIQUE_MESSAGE);
  }

  const neuteredAt = await resolveEventDate(animalId, data.date);

  await prisma.$transaction(async (tx) => {
    await assertNoConflicts(tx, [animalId], {
      kind: "record",
      type: "neutering",
    });
    await tx.animalNeutering.create({
      data: {
        animalId,
        neuteredAt,
        techniqueId: data.techniqueId,
        notes: data.notes,
      },
    });
    await tx.animal.update({
      where: { id: animalId },
      data: { neutered: true },
    });
  });
}
