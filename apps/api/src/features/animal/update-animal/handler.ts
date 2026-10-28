import { zonedDateTimeToInstant, type AnimalUpdateData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../../lib/db-dates";
import { write } from "../../../lib/db-errors";
import { NotFoundError } from "../../../lib/errors";
import { propertyTimeZone } from "../../property/time-zone";
import { assertNoConflicts } from "../commitments";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../neutering/technique";
import { updateCommitmentIntents } from "../rules";
import { fieldError } from "../shared";

// Edição pelo cadastro: dados básicos e, quando informados, troca de lote, novo
// brinco/RFID, castração e nova pesagem (registrados na hora). Respeita os compromissos
// do animal em operações abertas.
export async function updateAnimal(id: string, data: AnimalUpdateData) {
  const current = await prisma.animal.findUnique({
    where: { id },
    select: { currentPropertyId: true },
  });
  if (!current) throw new NotFoundError("Animal não encontrado.");

  if (data.newBatchId) {
    const batch = await prisma.batch.findFirst({
      where: {
        id: data.newBatchId,
        propertyId: current.currentPropertyId,
        closedAt: null,
      },
      select: { id: true },
    });
    if (!batch) {
      throw fieldError(
        "newBatchId",
        "Lote inválido ou inativo para a propriedade do animal.",
      );
    }
  }

  if (
    data.neuteredAt &&
    !(await isValidNeuteringTechnique(data.neuteringTechniqueId))
  ) {
    throw fieldError("neuteringTechniqueId", INVALID_TECHNIQUE_MESSAGE);
  }

  const now = new Date();

  // A data e hora informadas valem no fuso da propriedade do animal.
  const timeZone = await propertyTimeZone(current.currentPropertyId);

  const intents = updateCommitmentIntents(data);

  await write(() =>
    prisma.$transaction(async (tx) => {
      for (const intent of intents) {
        await assertNoConflicts(tx, [id], intent);
      }

      await tx.animal.update({
        where: { id },
        data: {
          name: data.name,
          breedId: data.breedId,
          birthDate: data.birthDate ? toDbDate(data.birthDate) : null,
          sex: data.sex,
          ...(data.newTag !== undefined ? { currentTag: data.newTag } : {}),
          ...(data.newRfid !== undefined ? { currentRfid: data.newRfid } : {}),
          ...(data.newBatchId ? { currentBatchId: data.newBatchId } : {}),
          ...(data.newWeightKg != null
            ? { currentWeight: data.newWeightKg }
            : {}),
          ...(data.neuteredAt ? { neutered: true } : {}),
        },
      });

      if (data.newTag !== undefined) {
        await tx.animalTagging.create({
          data: {
            animalId: id,
            tag: data.newTag,
            notes: data.tagChangeNotes,
            identifiedAt: now,
          },
        });
      }

      if (data.newRfid !== undefined) {
        await tx.animalRfidTagging.create({
          data: {
            animalId: id,
            rfid: data.newRfid,
            notes: data.rfidChangeNotes,
            identifiedAt: now,
          },
        });
      }

      if (data.newBatchId) {
        const activeBatchHistory = await tx.animalBatchHistory.findFirst({
          where: { animalId: id, exitedAt: null },
        });
        if (activeBatchHistory) {
          await tx.animalBatchHistory.update({
            where: { id: activeBatchHistory.id },
            data: { exitedAt: now },
          });
        }

        await tx.animalBatchHistory.create({
          data: {
            animalId: id,
            batchId: data.newBatchId,
            enteredAt: now,
            notes: data.batchChangeNotes,
          },
        });
      }

      if (data.neuteredAt) {
        await tx.animalNeutering.create({
          data: {
            animalId: id,
            neuteredAt: zonedDateTimeToInstant(data.neuteredAt, timeZone),
            techniqueId: data.neuteringTechniqueId,
            notes: data.neuteringNotes,
          },
        });
      }

      if (data.newWeightKg != null) {
        await tx.animalWeighing.create({
          data: {
            animalId: id,
            weight: data.newWeightKg,
            notes: data.weightChangeNotes,
            weighedAt: now,
          },
        });
      }
    }),
  );
}
