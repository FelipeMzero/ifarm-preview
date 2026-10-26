import type { PurchaseData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../../lib/db-dates";
import { planCategoryChanges, PurchaseError, purchaseStatus } from "../rules";

// Altera a negociação enquanto a compra está em andamento. Categorias com animais
// recebidos não podem ser removidas. Depois do pagamento, o que define o valor (vendedor,
// conjunto de categorias e seus preços/pesos) fica bloqueado.
export async function updatePurchase(id: string, data: PurchaseData) {
  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: {
        categories: {
          include: { _count: { select: { animals: true } } },
        },
      },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);
    if (purchaseStatus(event) !== "open") {
      throw new PurchaseError(
        "Somente compras em andamento podem ser alteradas.",
        409,
      );
    }

    const { removedIds, existingIds } = planCategoryChanges(
      event.categories.map((c) => ({
        ...c,
        receivedAnimals: c._count.animals,
      })),
      data.categories,
      {
        paid: event.paymentDate != null,
        sellerChanged: data.sellerId !== event.sellerId,
      },
    );

    const seller = await tx.person.findFirst({
      where: { id: data.sellerId, deactivatedAt: null },
      select: { id: true },
    });
    if (!seller && data.sellerId !== event.sellerId) {
      throw new PurchaseError("Vendedor inválido.", 400, "sellerId");
    }

    if (removedIds.length) {
      await tx.purchaseCategory.deleteMany({
        where: { id: { in: removedIds } },
      });
    }

    for (const { id: categoryId, ...category } of data.categories) {
      if (categoryId != null && existingIds.has(categoryId)) {
        await tx.purchaseCategory.update({
          where: { id: categoryId },
          data: category,
        });
      } else {
        await tx.purchaseCategory.create({
          data: { ...category, eventId: id },
        });
      }
    }

    await tx.purchaseEvent.update({
      where: { id },
      data: {
        title: data.title,
        purchaseDate: toDbDate(data.purchaseDate),
        notes: data.notes,
        sellerId: data.sellerId,
      },
    });
  });
}
