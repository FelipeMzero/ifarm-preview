import { prisma } from "@ifarm/db";
import { cancellationBlocker, PurchaseError } from "../rules";

// Cancela (desconsidera) uma compra em andamento, ainda sem animais recebidos e não paga.
// As recepções em aberto (vazias) são canceladas junto.
export async function cancelPurchase(id: string) {
  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: {
        receptions: { select: { managementSessionId: true } },
        _count: { select: { purchasedAnimals: true } },
      },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);
    const blocker = cancellationBlocker({
      ...event,
      receivedAnimals: event._count.purchasedAnimals,
    });
    if (blocker) throw new PurchaseError(blocker, 409);

    const now = new Date();
    await tx.purchaseEvent.update({
      where: { id },
      data: { cancelledAt: now },
    });
    await tx.managementSession.updateMany({
      where: {
        id: { in: event.receptions.map((r) => r.managementSessionId) },
        confirmedAt: null,
        cancelledAt: null,
      },
      data: { cancelledAt: now },
    });
  });
}
