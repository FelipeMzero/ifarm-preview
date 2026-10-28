import { zonedDateTimeToInstant, type BatchTransferData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { diffIds } from "../../../lib/diff";
import { BusinessError, NotFoundError } from "../../../lib/errors";
import { assertNoConflicts } from "../../animal/commitments.public";
import { propertyTimeZone } from "../../property/time-zone.public";
import { transferStatus } from "../rules";
import { validateTransferPlan } from "../shared";

const NOT_PENDING = "Somente transferências pendentes podem ser alteradas.";

// Altera um plano pendente que não pertence a uma sessão de manejo.
export async function updateBatchTransfer(id: string, data: BatchTransferData) {
  const current = await prisma.animalBatchTransfer.findUnique({
    where: { id },
    include: { items: { select: { id: true, animalId: true } } },
  });
  if (!current) throw new NotFoundError("Transferência não encontrada.");

  if (current.managementSessionId) {
    throw new BusinessError(
      "Esta transferência faz parte de uma sessão de manejo e só pode ser alterada pela sessão.",
      409,
    );
  }
  if (transferStatus(current) !== "pending") {
    throw new BusinessError(NOT_PENDING, 409);
  }

  const animalIds = [...new Set(data.animalIds)];
  await validateTransferPlan({
    propertyId: current.propertyId,
    destinationBatchId: data.destinationBatchId,
    animalIds,
  });

  // Mantém os itens que continuam no plano (preserva createdAt/notes) e só
  // remove/adiciona a diferença.
  const { removed, added: addedAnimalIds } = diffIds(
    current.items,
    animalIds,
    (i) => i.animalId,
  );
  const removedItemIds = removed.map((i) => i.id);

  // A data e hora informadas valem no fuso da propriedade.
  const transferredAt = zonedDateTimeToInstant(
    data.transferredAt,
    await propertyTimeZone(current.propertyId),
  );

  await prisma.$transaction(async (tx) => {
    // Condicional ao status para não sobrescrever uma confirmação concorrente.
    const updated = await tx.animalBatchTransfer.updateMany({
      where: { id, confirmedAt: null, cancelledAt: null },
      data: {
        transferredAt,
        notes: data.notes,
        destinationBatchId: data.destinationBatchId,
      },
    });
    if (updated.count !== 1) throw new BusinessError(NOT_PENDING, 409);

    if (removedItemIds.length) {
      await tx.animalBatchTransferItem.deleteMany({
        where: { id: { in: removedItemIds } },
      });
    }

    await assertNoConflicts(
      tx,
      addedAnimalIds,
      { kind: "transfer" },
      { transferId: id },
    );

    if (addedAnimalIds.length) {
      await tx.animalBatchTransferItem.createMany({
        data: addedAnimalIds.map((animalId) => ({
          transferId: id,
          animalId,
        })),
      });
    }
  });
}
