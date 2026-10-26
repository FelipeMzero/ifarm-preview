import { prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";

// Encerra um lote vazio e libera a área que ele ocupava. Lote com animais ativos ou
// destino de transferências pendentes não pode ser encerrado.
export async function closeBatch(id: string) {
  await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id },
      select: { closedAt: true },
    });
    if (!batch) throw new BusinessError("Lote não encontrado.", 404);
    if (batch.closedAt)
      throw new BusinessError("O lote já está encerrado.", 409);

    const animalCount = await tx.animal.count({
      where: { currentBatchId: id, status: "ACTIVE" },
    });
    if (animalCount > 0) {
      throw new BusinessError(
        `O lote ainda tem ${animalCount} animal(is). Transfira-os antes de encerrar.`,
        409,
        undefined,
        { code: "HAS_ANIMALS", animalCount },
      );
    }

    const pendingIncoming = await tx.animalBatchTransfer.count({
      where: { destinationBatchId: id, confirmedAt: null, cancelledAt: null },
    });
    if (pendingIncoming > 0) {
      throw new BusinessError(
        `O lote é destino de ${pendingIncoming} transferência(s) pendente(s). Cancele-as ou altere o destino antes de encerrar.`,
        409,
        undefined,
        { code: "HAS_PENDING_TRANSFERS", pendingIncoming },
      );
    }

    const now = new Date();
    // Condicional ao status para não encerrar duas vezes em requisições simultâneas.
    const closed = await tx.batch.updateMany({
      where: { id, closedAt: null },
      data: { closedAt: now },
    });
    if (closed.count !== 1) {
      throw new BusinessError("O lote já está encerrado.", 409);
    }

    await tx.batchAreaHistory.updateMany({
      where: { batchId: id, exitedAt: null },
      data: { exitedAt: now },
    });
  });
}
