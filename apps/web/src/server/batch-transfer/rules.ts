import { type AnimalStatus, type BatchTransferStatus } from "@ifarm/shared";
import type { Prisma } from "@/server/db";
import { unavailableReason } from "@/server/animal/rules";

export function transferStatus(t: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}): BatchTransferStatus {
  if (t.cancelledAt) return "cancelled";
  if (t.confirmedAt) return "confirmed";
  return "pending";
}

// Filtro de cada situação na consulta, coerente com transferStatus (ver o teste).
export const TRANSFER_STATUS_WHERE = {
  pending: { confirmedAt: null, cancelledAt: null },
  confirmed: { confirmedAt: { not: null }, cancelledAt: null },
  cancelled: { cancelledAt: { not: null } },
} satisfies Record<BatchTransferStatus, Prisma.AnimalBatchTransferWhereInput>;

type TransferAnimal = {
  status: AnimalStatus;
  currentPropertyId: string;
  currentBatchId: string | null;
};

// Animais do plano que impedem a transferência: os que não estão ativos na propriedade e
// os que já estão no lote de destino. Vale ao salvar o plano e ao confirmá-lo.
export function blockedTransferAnimals<T extends TransferAnimal>(
  animals: T[],
  propertyId: string,
  destinationBatchId: string,
) {
  const unavailable: T[] = [];
  const alreadyInDestination: T[] = [];
  for (const a of animals) {
    if (unavailableReason(a, propertyId)) unavailable.push(a);
    else if (a.currentBatchId === destinationBatchId)
      alreadyInDestination.push(a);
  }
  return { unavailable, alreadyInDestination };
}

// O animal muda de lote na data da transferência, que não pode ser anterior à entrada
// dele no lote atual. Devolve os históricos ativos que violam isso.
export function enteredAfter<T extends { enteredAt: Date }>(
  activeHistories: T[],
  transferredAt: Date,
) {
  return activeHistories.filter((h) => h.enteredAt > transferredAt);
}
