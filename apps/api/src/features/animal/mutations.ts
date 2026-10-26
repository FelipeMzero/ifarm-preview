import {
  toLocalDateTime,
  type AnimalCreateData,
  type AnimalUpdateData,
  type NeuteringCancelData,
  type NeuteringCorrectionData,
  type NeuteringCreateData,
  type WeighingCorrectionData,
  type WeighingCreateData,
  fromLocalDay,
  REQUIRED_TECHNIQUE_MESSAGE,
} from "@ifarm/shared";
import { prisma, Prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "@ifarm/domain/current-property/queries";
import { write } from "@ifarm/domain/db-errors";
import { deleteRecord } from "@ifarm/domain/deletion";
import {
  BusinessError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@ifarm/domain/errors";
import {
  effectiveNeutering,
  effectiveWeighing,
} from "../management-session/effective";
import { assertNoConflicts } from "./commitments";
import { animalDeletionPolicy } from "./deletion-policy";
import {
  assertNotBeforeBirth,
  assertNotFuture,
  resolveEventDate,
} from "./eventDate";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "./neuterings";
import {
  keepsOriginal,
  sessionDateLock,
  updateCommitmentIntents,
} from "./rules";
import { recomputeCurrentWeight } from "./weighings";
import { toDbDate } from "@ifarm/domain/db-dates";

const fieldError = (field: string, message: string) =>
  new ValidationError(message, { [field]: message });

// Cadastro avulso de um animal, com os registros iniciais (lote, propriedade, pesagem,
// identificação, castração) na data de entrada. Origem compra gera uma compra avulsa já
// consolidada.
export async function createAnimal(data: AnimalCreateData, userId: string) {
  if (
    data.neutered &&
    !(await isValidNeuteringTechnique(data.neuteringTechniqueId))
  ) {
    throw fieldError("neuteringTechniqueId", INVALID_TECHNIQUE_MESSAGE);
  }

  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id ?? null;
  if (!propertyId) {
    throw new BusinessError("Nenhuma propriedade selecionada.", 400);
  }

  const batch = await prisma.batch.findFirst({
    where: { id: data.batchId, propertyId, closedAt: null },
    select: { id: true },
  });
  if (!batch) {
    throw fieldError(
      "batchId",
      "Lote inválido ou inativo para a propriedade selecionada.",
    );
  }

  const entryDate = data.propertyEntryDate
    ? toLocalDateTime(data.propertyEntryDate)
    : new Date();

  const animal = await write(() =>
    prisma.$transaction(async (tx) => {
      const created = await tx.animal.create({
        data: {
          currentTag: data.currentTag,
          currentRfid: data.currentRfid,
          name: data.name,
          sex: data.sex,
          origin: data.origin,
          status: "ACTIVE",
          birthDate: data.birthDate ? toDbDate(data.birthDate) : null,
          breedId: data.breedId,
          currentBatchId: data.batchId,
          currentPropertyId: propertyId,
          currentWeight: data.currentWeightKg,
          neutered: data.neutered,
        },
      });

      await tx.animalPropertyHistory.create({
        data: { animalId: created.id, propertyId, enteredAt: entryDate },
      });

      await tx.animalBatchHistory.create({
        data: {
          animalId: created.id,
          batchId: data.batchId,
          enteredAt: entryDate,
        },
      });

      if (data.currentWeightKg != null) {
        await tx.animalWeighing.create({
          data: {
            animalId: created.id,
            weight: data.currentWeightKg,
            weighedAt: entryDate,
          },
        });
      }

      if (data.currentTag != null) {
        await tx.animalTagging.create({
          data: {
            animalId: created.id,
            tag: data.currentTag,
            identifiedAt: entryDate,
          },
        });
      }

      if (data.currentRfid != null) {
        await tx.animalRfidTagging.create({
          data: {
            animalId: created.id,
            rfid: data.currentRfid,
            identifiedAt: entryDate,
          },
        });
      }

      if (data.neutered) {
        await tx.animalNeutering.create({
          data: {
            animalId: created.id,
            techniqueId: data.neuteringTechniqueId,
            neuteredAt: data.neuteringDate
              ? toLocalDateTime(data.neuteringDate)
              : entryDate,
          },
        });
      }

      // Compra avulsa de um animal: compra já consolidada, com uma categoria de 1 animal
      // e uma recepção já concluída (o modelo liga o animal à compra pela recepção).
      if (data.origin === "PURCHASE") {
        const now = new Date();
        const seller = await tx.person.findUniqueOrThrow({
          where: { id: data.sellerId! },
          select: { name: true },
        });

        // Dia da compra (@db.Date): o da aquisição ou o da entrada na fazenda.
        const purchaseDate = toDbDate(
          data.acquisitionDate ?? fromLocalDay(entryDate),
        );
        const purchaseEvent = await tx.purchaseEvent.create({
          data: {
            title: `Compra avulsa de ${seller.name}`,
            purchaseDate,
            notes: data.purchaseNotes,
            // Já terminou: paga (com o valor informado) e consolidada.
            paymentDate: data.purchasePrice != null ? purchaseDate : null,
            confirmedAt: now,
            sellerId: data.sellerId!,
            destinationPropertyId: propertyId,
          },
        });

        const category = await tx.purchaseCategory.create({
          data: {
            eventId: purchaseEvent.id,
            sex: data.sex,
            breedId: data.breedId,
            expectedQuantity: 1,
            pricingType: "LUMP_SUM",
            totalPrice: data.purchasePrice,
          },
        });

        const session = await tx.managementSession.create({
          data: {
            propertyId,
            title: `Recepção de compra (${seller.name})`,
            scheduledAt: entryDate,
            performedAt: entryDate,
            confirmedAt: now,
            participants: { create: { animalId: created.id } },
          },
        });
        const reception = await tx.purchaseReception.create({
          data: {
            purchaseEventId: purchaseEvent.id,
            managementSessionId: session.id,
            entryBatchId: data.batchId,
          },
        });

        await tx.purchasedAnimal.create({
          data: {
            purchaseEventId: purchaseEvent.id,
            categoryId: category.id,
            receptionId: reception.id,
            animalId: created.id,
            cost: data.purchasePrice,
          },
        });
      }

      return created;
    }),
  );
  return { id: animal.id };
}

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
            neuteredAt: toLocalDateTime(data.neuteredAt),
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

// Exclusão pela política de animal (ver deletion-policy.ts).
export async function deleteAnimal(id: string) {
  try {
    await deleteRecord(animalDeletionPolicy, id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("Animal não encontrado.");
      }
      // Vínculo que a policy não cobre: a FK barrou a exclusão.
      if (error.code === "P2003") {
        throw new ConflictError(
          "Este registro está em uso e não pode ser excluído.",
        );
      }
    }
    throw error;
  }
}

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

async function findActiveWeighing(animalId: string, weighingId: string) {
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

// Exclusão lógica da pesagem; o peso atual é recalculado.
export async function cancelWeighing(animalId: string, weighingId: string) {
  const weighing = await findActiveWeighing(animalId, weighingId);

  await prisma.$transaction(async (tx) => {
    await tx.animalWeighing.update({
      where: { id: weighing.id },
      data: { cancelledAt: new Date() },
    });

    await recomputeCurrentWeight(tx, animalId);
  });
}

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

async function findActiveNeutering(animalId: string, neuteringId: string) {
  const numericId = Number(neuteringId);
  const neutering = Number.isInteger(numericId)
    ? await prisma.animalNeutering.findFirst({
        where: {
          id: numericId,
          animalId,
          cancelledAt: null,
          ...effectiveNeutering,
        },
      })
    : null;
  if (!neutering) throw new NotFoundError("Castração não encontrada.");
  return neutering;
}

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

// Exclusão lógica da castração. Sem nenhuma castração restante, o usuário decide se o
// animal continua castrado (pode ter chegado castrado, sem registro). Padrão: não castrado.
export async function cancelNeutering(
  animalId: string,
  neuteringId: string,
  data: NeuteringCancelData,
) {
  const neutering = await findActiveNeutering(animalId, neuteringId);

  await prisma.$transaction(async (tx) => {
    await tx.animalNeutering.update({
      where: { id: neutering.id },
      data: { cancelledAt: new Date() },
    });

    const remaining = await tx.animalNeutering.count({
      where: { animalId, cancelledAt: null, ...effectiveNeutering },
    });
    if (remaining === 0) {
      await tx.animal.update({
        where: { id: animalId },
        data: { neutered: data.keepNeutered ?? false },
      });
    }
  });
}
