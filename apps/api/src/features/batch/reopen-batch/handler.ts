import type { BatchReopenData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";
import { assertAreaAvailable } from "../../area/availability";

// Reativa um lote encerrado numa área livre. Abre um novo registro de área (em vez
// de reabrir o antigo) para o período encerrado continuar visível no histórico.
export async function reopenBatch(id: string, data: BatchReopenData) {
  const { areaId, notes } = data;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id },
      select: { closedAt: true, propertyId: true },
    });
    if (!batch) throw new BusinessError("Lote não encontrado.", 404);
    if (!batch.closedAt) {
      throw new BusinessError("O lote não está encerrado.", 409);
    }

    await assertAreaAvailable(tx, {
      areaId,
      propertyId: batch.propertyId,
      exceptBatchId: id,
      field: "areaId",
    });

    // Condicional ao status para não reativar duas vezes em requisições simultâneas.
    const reopened = await tx.batch.updateMany({
      where: { id, closedAt: { not: null } },
      data: { closedAt: null },
    });
    if (reopened.count !== 1) {
      throw new BusinessError("O lote não está encerrado.", 409);
    }

    await tx.batchAreaHistory.create({
      data: { batchId: id, areaId, enteredAt: new Date(), notes },
    });
  });
}
