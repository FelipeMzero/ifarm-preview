import { zonedDateTimeToInstant, type BatchTransferData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";
import { assertNoConflicts } from "../../animal/commitments";
import { propertyTimeZone } from "../../property/time-zone";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";
import { validateTransferPlan } from "../shared";

// Planeja uma transferência (pendente) para a propriedade informada ou a atual do usuário.
export async function createBatchTransfer(
  data: BatchTransferData,
  userId: string,
) {
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) {
    throw new BusinessError("Nenhuma propriedade selecionada.", 400);
  }

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
