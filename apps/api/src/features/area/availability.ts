import { type Prisma } from "@ifarm/db";
import { ValidationError } from "@ifarm/domain/errors";

// Ocupação de uma área por lote: usada pelas operações de área e pelas de lote (criar,
// mover e reativar um lote).

// A área recebe o lote se está ativa na propriedade e não é ocupada por outro lote ativo
// (`exceptBatchId`: o próprio lote, ao trocar de área ou reativar). Erro no campo `field`.
export async function assertAreaAvailable(
  tx: Prisma.TransactionClient,
  params: {
    areaId: string;
    propertyId: string;
    exceptBatchId?: string;
    field: string;
  },
) {
  const { areaId, propertyId, exceptBatchId, field } = params;

  const area = await tx.area.findFirst({
    where: { id: areaId, propertyId, closedAt: null },
    select: { id: true },
  });
  if (!area) {
    throw new ValidationError("Área inválida.", {
      [field]: "Área inválida ou inativa para a propriedade selecionada.",
    });
  }

  const occupant = await findOccupyingBatch(tx, areaId, exceptBatchId);
  if (occupant) {
    throw new ValidationError("Área ocupada.", {
      [field]: `A área selecionada já está ocupada pelo lote "${occupant.name}".`,
    });
  }
}

// Lote ativo que ocupa a área agora (null = livre), fora `exceptBatchId`.
export async function findOccupyingBatch(
  tx: Prisma.TransactionClient,
  areaId: string,
  exceptBatchId?: string,
) {
  const occupied = await tx.batchAreaHistory.findFirst({
    where: {
      areaId,
      exitedAt: null,
      batch: { closedAt: null },
      ...(exceptBatchId ? { batchId: { not: exceptBatchId } } : {}),
    },
    select: { batch: { select: { id: true, name: true } } },
  });
  return occupied?.batch ?? null;
}
