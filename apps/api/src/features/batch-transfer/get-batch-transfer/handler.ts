import { instantToZonedIso, type BatchTransferDetail } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { unavailableReason } from "../../animal/availability.public";
import { transferStatus } from "../rules";
import { toZonedIso } from "../../property/time-zone.public";

export async function getBatchTransfer(
  id: string,
): Promise<BatchTransferDetail> {
  const transfer = await prisma.animalBatchTransfer.findUnique({
    where: { id },
    include: {
      destinationBatch: { select: { id: true, name: true } },
      property: { select: { timeZone: true } },
      items: {
        orderBy: { id: "asc" },
        include: {
          originBatch: { select: { id: true, name: true } },
          animal: {
            select: {
              id: true,
              code: true,
              currentTag: true,
              currentRfid: true,
              name: true,
              sex: true,
              status: true,
              currentPropertyId: true,
              currentWeight: true,
              currentBatch: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!transfer) throw new NotFoundError("Transferência não encontrada.");

  return {
    id: transfer.id,
    // No fuso da propriedade, com o deslocamento.
    transferredAt: instantToZonedIso(
      transfer.transferredAt,
      transfer.property.timeZone,
    ),
    notes: transfer.notes ?? "",
    destinationBatch: transfer.destinationBatch,
    propertyId: transfer.propertyId,
    status: transferStatus(transfer),
    confirmedAt: toZonedIso(transfer.confirmedAt, transfer.property.timeZone),
    cancelledAt: toZonedIso(transfer.cancelledAt, transfer.property.timeZone),
    updatedAt: toZonedIso(transfer.updatedAt, transfer.property.timeZone),
    animals: transfer.items.map(({ animal, originBatch }) => ({
      id: animal.id,
      code: animal.code,
      earTag: animal.currentTag,
      rfid: animal.currentRfid,
      name: animal.name,
      sex: animal.sex,
      status: animal.status,
      currentWeightKg: animal.currentWeight?.toNumber() ?? null,
      currentBatch: animal.currentBatch,
      originBatch,
      // Só pendente: depois de encerrada, não há o que remover.
      unavailableReason:
        transferStatus(transfer) === "pending"
          ? unavailableReason(animal, transfer.propertyId)
          : null,
    })),
  };
}
