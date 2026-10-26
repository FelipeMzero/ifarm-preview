import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../animal/commitments";
import { confirmTransferInTx, ConfirmError } from "../confirmTransfer";

// Efetiva o plano (ver confirmTransferInTx). Transferências geradas por uma sessão de
// manejo só são efetivadas pela consolidação da sessão.
export async function confirmBatchTransfer(id: string) {
  await prisma.$transaction(async (tx) => {
    const transfer = await tx.animalBatchTransfer.findUnique({
      where: { id },
      select: {
        managementSessionId: true,
        items: { select: { animalId: true } },
      },
    });
    if (transfer?.managementSessionId) {
      throw new ConfirmError(
        "Esta transferência faz parte de uma sessão de manejo e é efetivada na consolidação da sessão.",
      );
    }
    // Rechecagem: pega conflitos anteriores a esta regra e inclusões simultâneas.
    await assertNoConflicts(
      tx,
      transfer?.items.map((i) => i.animalId) ?? [],
      { kind: "transfer" },
      { transferId: id },
    );
    await confirmTransferInTx(tx, id);
  });
}
