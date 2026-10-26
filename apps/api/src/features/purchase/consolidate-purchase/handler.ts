import { isSessionOpen } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { sessionStatus } from "../../management-session/session-steps";
import { allocatePurchaseCosts } from "../costs";
import { consolidationBlocker, PurchaseError } from "../rules";

// Consolida a compra: fim do processo. Exige pagamento, ao menos um animal recebido e
// nenhuma recepção em aberto. O custo de cada animal é rateado aqui, uma única vez; a
// partir daí nada mais muda (nem recepções novas).
export async function consolidatePurchase(id: string) {
  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: {
        receptions: { select: { managementSession: true } },
        _count: { select: { purchasedAnimals: true } },
      },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);
    const blocker = consolidationBlocker({
      ...event,
      receivedAnimals: event._count.purchasedAnimals,
      openReceptions: event.receptions.filter((r) =>
        isSessionOpen(sessionStatus(r.managementSession)),
      ).length,
    });
    if (blocker) throw new PurchaseError(blocker, 409);

    const done = await tx.purchaseEvent.updateMany({
      where: { id, confirmedAt: null, cancelledAt: null },
      data: { confirmedAt: new Date() },
    });
    if (done.count !== 1) {
      throw new PurchaseError(
        "Somente compras em andamento podem ser consolidadas.",
        409,
      );
    }

    await allocatePurchaseCosts(tx, id);
  });
}
