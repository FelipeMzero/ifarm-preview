import {
  OPEN_SESSION_STATUSES,
  type ReceptionDocumentsData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { requireSessionIn, StepError } from "../../shared";

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
export async function updateReceptionDocuments(
  id: string,
  data: ReceptionDocumentsData,
) {
  await prisma.$transaction(async (tx) => {
    await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "A recepção já foi concluída ou cancelada.",
    );
    const updated = await tx.purchaseReception.updateMany({
      where: { managementSessionId: id },
      data,
    });
    if (updated.count !== 1) {
      throw new StepError("Esta sessão não é uma recepção de compra.", 400);
    }
  });
}
