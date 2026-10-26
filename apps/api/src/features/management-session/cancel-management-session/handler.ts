import { prisma } from "@ifarm/db";
import { findReception } from "../../purchase/reception";
import { StepError } from "../shared";

// Cancela a sessão. Os registros feitos continuam gravados (para auditoria), mas como a
// sessão nunca será consolidada eles não passam a valer.
export async function cancelManagementSession(id: string) {
  await prisma.$transaction(async (tx) => {
    // Recepção com animais recebidos não é cancelada: os animais já existem na
    // fazenda; primeiro é preciso removê-los da recepção (o que desfaz o recebimento).
    if (await findReception(tx, id)) {
      const received = await tx.managementParticipant.count({
        where: { managementSessionId: id },
      });
      if (received) {
        throw new StepError(
          `A recepção tem ${received} animal(is) recebido(s). Remova-os antes de cancelar.`,
          409,
        );
      }
    }

    const now = new Date();
    const cancelled = await tx.managementSession.updateMany({
      where: { id, confirmedAt: null, cancelledAt: null },
      data: { cancelledAt: now },
    });
    if (cancelled.count !== 1) {
      throw new StepError(
        "Somente sessões não consolidadas podem ser canceladas.",
        409,
      );
    }

    await tx.animalBatchTransfer.updateMany({
      where: {
        managementSessionId: id,
        confirmedAt: null,
        cancelledAt: null,
      },
      data: { cancelledAt: now },
    });
  });
}
