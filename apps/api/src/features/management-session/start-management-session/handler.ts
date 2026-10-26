import {
  OPEN_SESSION_STATUSES,
  type ManagementSessionStartData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { requireSessionIn, StepError } from "../shared";

// Inicia o registro informando a data em que o manejo acontece. Também serve para
// corrigir essa data enquanto a sessão não for consolidada: os registros recebem a
// data definitiva na consolidação.
export async function startManagementSession(
  id: string,
  data: ManagementSessionStartData,
) {
  const { performedAt } = data;
  if (performedAt > new Date()) {
    throw new StepError(
      "A data do manejo não pode ser futura.",
      400,
      "performedAt",
    );
  }

  await prisma.$transaction(async (tx) => {
    await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "Somente sessões não consolidadas podem ser iniciadas.",
    );
    await tx.managementSession.update({
      where: { id },
      data: { performedAt },
    });
  });
}
