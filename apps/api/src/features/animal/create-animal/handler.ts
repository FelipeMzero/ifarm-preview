import {
  dayInZone,
  zonedDateTimeToInstant,
  type AnimalCreateData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../../lib/db-dates";
import { write } from "../../../lib/db-errors";
import { BusinessError } from "../../../lib/errors";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";
import { propertyTimeZone } from "../../property/time-zone";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../neutering/technique";
import { fieldError } from "../shared";

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

  // As datas e horas informadas valem no fuso da propriedade.
  const timeZone = await propertyTimeZone(propertyId);
  const entryDate = data.propertyEntryDate
    ? zonedDateTimeToInstant(data.propertyEntryDate, timeZone)
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
              ? zonedDateTimeToInstant(data.neuteringDate, timeZone)
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

        // Dia da compra (@db.Date): o da aquisição ou o da entrada na fazenda (no fuso dela).
        const purchaseDate = toDbDate(
          data.acquisitionDate ?? dayInZone(entryDate, timeZone),
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
