import "server-only";
import {
  animalLabel,
  summarize,
  unavailableAnimalsMessage,
  unavailableReason,
} from "@ifarm/shared";
import { Prisma } from "@/server/db";
import { BusinessError } from "@/server/errors";
import { transferStatus } from "./rules";

type Tx = Prisma.TransactionClient;

export class ConfirmError extends BusinessError {
  constructor(message: string, status = 409) {
    super(message, status);
  }
}

// Efetiva o plano: registra o lote de origem de cada item, fecha o histórico ativo de
// cada animal, abre um novo no lote de destino e sincroniza Animal.currentBatchId.
// Também usado na consolidação das sessões de manejo (apartação).
export async function confirmTransferInTx(tx: Tx, id: string) {
  const transfer = await tx.animalBatchTransfer.findUnique({
    where: { id },
    include: {
      destinationBatch: { select: { closedAt: true } },
      items: {
        include: {
          animal: {
            select: {
              id: true,
              code: true,
              currentTag: true,
              currentRfid: true,
              status: true,
              currentBatchId: true,
              currentPropertyId: true,
            },
          },
        },
      },
    },
  });

  if (!transfer) {
    throw new ConfirmError("Transferência não encontrada.", 404);
  }

  if (transferStatus(transfer) !== "pending") {
    throw new ConfirmError(
      "Somente transferências pendentes podem ser confirmadas.",
    );
  }

  if (transfer.items.length === 0) {
    throw new ConfirmError(
      "Adicione ao menos um animal antes de confirmar a transferência.",
    );
  }

  if (transfer.destinationBatch.closedAt) {
    throw new ConfirmError("O lote de destino está encerrado.");
  }

  const now = new Date();
  if (transfer.transferredAt > now) {
    throw new ConfirmError(
      "A data da transferência é futura. Ajuste a data para confirmar.",
    );
  }

  // Os animais mudam de lote na data e hora programadas.
  const effectiveDate = transfer.transferredAt;

  const inactive = transfer.items.filter(({ animal }) =>
    unavailableReason(animal, transfer.propertyId),
  );
  if (inactive.length) {
    throw new ConfirmError(
      unavailableAnimalsMessage(
        summarize(inactive.map(({ animal }) => animalLabel(animal))),
      ),
    );
  }

  const alreadyInDestination = transfer.items.filter(
    ({ animal }) => animal.currentBatchId === transfer.destinationBatchId,
  );
  if (alreadyInDestination.length) {
    throw new ConfirmError(
      `Animais que já estão no lote de destino: ${summarize(
        alreadyInDestination.map(({ animal }) => animalLabel(animal)),
      )}. Remova-os da transferência antes de confirmar.`,
    );
  }

  const animalIds = transfer.items.map((i) => i.animalId);
  const activeHistories = await tx.animalBatchHistory.findMany({
    where: { animalId: { in: animalIds }, exitedAt: null },
  });

  const enteredLater = activeHistories.filter(
    (h) => h.enteredAt > effectiveDate,
  );
  if (enteredLater.length) {
    const byId = new Map(transfer.items.map((i) => [i.animalId, i.animal]));
    throw new ConfirmError(
      `A data da transferência é anterior à entrada no lote atual de: ${summarize(
        enteredLater.map((h) => animalLabel(byId.get(h.animalId)!)),
      )}.`,
    );
  }

  // Condicional ao status para não confirmar duas vezes em requisições simultâneas.
  const confirmed = await tx.animalBatchTransfer.updateMany({
    where: { id, confirmedAt: null, cancelledAt: null },
    data: { confirmedAt: now },
  });
  if (confirmed.count !== 1) {
    throw new ConfirmError(
      "Somente transferências pendentes podem ser confirmadas.",
    );
  }

  // Registra de qual lote cada animal saiu (agrupado para uma escrita por lote).
  const itemsByOrigin = new Map<string | null, number[]>();
  for (const item of transfer.items) {
    const origin = item.animal.currentBatchId;
    itemsByOrigin.set(origin, [...(itemsByOrigin.get(origin) ?? []), item.id]);
  }
  for (const [originBatchId, itemIds] of itemsByOrigin) {
    await tx.animalBatchTransferItem.updateMany({
      where: { id: { in: itemIds } },
      data: { originBatchId },
    });
  }

  if (activeHistories.length) {
    await tx.animalBatchHistory.updateMany({
      where: { id: { in: activeHistories.map((h) => h.id) } },
      data: { exitedAt: effectiveDate },
    });
  }

  await tx.animalBatchHistory.createMany({
    data: transfer.items.map((item) => ({
      animalId: item.animalId,
      batchId: transfer.destinationBatchId,
      enteredAt: effectiveDate,
      notes: item.notes ?? transfer.notes,
    })),
  });

  await tx.animal.updateMany({
    where: { id: { in: animalIds } },
    data: { currentBatchId: transfer.destinationBatchId },
  });
}
