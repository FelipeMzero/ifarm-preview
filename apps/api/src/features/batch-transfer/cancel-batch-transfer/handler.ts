import { prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";

// Cancela um plano pendente. O registro é mantido (cancelledAt) para auditoria.
export async function cancelBatchTransfer(id: string) {
  const cancelled = await prisma.animalBatchTransfer.updateMany({
    where: {
      id,
      confirmedAt: null,
      cancelledAt: null,
      managementSessionId: null,
    },
    data: { cancelledAt: new Date() },
  });
  if (cancelled.count !== 1) {
    throw new BusinessError(
      "Somente transferências pendentes (fora de sessões de manejo) podem ser canceladas.",
      409,
    );
  }
}
