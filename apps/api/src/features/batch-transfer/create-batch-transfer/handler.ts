import { zonedDateTimeToInstant, type BatchTransferData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../animal/commitments.public";
import { propertyTimeZone } from "../../property/time-zone.public";
import { validateTransferPlan } from "../shared";

// Planeja uma transferência (pendente) para a propriedade informada ou a atual do usuário.
export async function createBatchTransfer(data: BatchTransferData) {
  const { propertyId } = data;
  const animalIds = [...new Set(data.animalIds)];
  await validateTransferPlan({
    propertyId,
    destinationBatchId: data.destinationBatchId,
    animalIds,
  });

  // A data e hora informadas valem no fuso da propriedade.
  const transferredAt = zonedDateTimeToInstant(
    data.transferredAt,
    await propertyTimeZone(propertyId),
  );

  const transfer = await prisma.$transaction(async (tx) => {
    await assertNoConflicts(tx, animalIds, { kind: "transfer" });
    return tx.animalBatchTransfer.create({
      data: {
        transferredAt,
        notes: data.notes,
        destinationBatchId: data.destinationBatchId,
        propertyId,
        items: {
          create: animalIds.map((animalId) => ({ animalId })),
        },
      },
    });
  });
  return { id: transfer.id };
}
