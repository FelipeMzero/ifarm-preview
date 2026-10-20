import "server-only";
import {
  isSessionOpen,
  today,
  type PurchaseData,
  type PurchasePaymentData,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { allocatePurchaseCosts } from "./costs";
import { categoryLabel } from "./reception";
import {
  cancellationBlocker,
  consolidationBlocker,
  missingValue,
  paymentBlocker,
  planCategoryChanges,
  PurchaseError,
  purchaseStatus,
} from "./rules";
import { sessionStatus } from "@/server/management-session/session-steps";
import { toDbDate } from "@/server/db-dates";

// Registra a negociação: título, vendedor e as categorias negociadas (com preços). Nenhum animal
// existe ainda; eles são criados nas recepções.
export async function createPurchase(data: PurchaseData, userId: string) {
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) throw new PurchaseError("Nenhuma propriedade selecionada.");

  const seller = await prisma.person.findFirst({
    where: { id: data.sellerId, deactivatedAt: null },
    select: { id: true },
  });
  if (!seller) throw new PurchaseError("Vendedor inválido.", 400, "sellerId");

  const event = await prisma.purchaseEvent.create({
    data: {
      title: data.title,
      purchaseDate: toDbDate(data.purchaseDate),
      notes: data.notes,
      sellerId: data.sellerId,
      destinationPropertyId: propertyId,
      categories: {
        create: data.categories.map((c) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = c;
          return rest;
        }),
      },
    },
  });
  return { id: event.id };
}

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

// Registra o pagamento de uma compra em andamento (data informada ou hoje). Exige o
// valor de todas as categorias conhecido; a partir daí os valores ficam bloqueados.
export async function payPurchase(id: string, data: PurchasePaymentData) {
  const paidDay = data.paymentDate ?? today();
  if (paidDay > today()) {
    throw new PurchaseError(
      "A data do pagamento não pode ser futura.",
      400,
      "paymentDate",
    );
  }

  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: { categories: { include: { breed: true } } },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);
    const blocker = paymentBlocker(event);
    if (blocker) throw new PurchaseError(blocker, 409);

    const incomplete = event.categories
      .map((c) => ({ c, missing: missingValue(c) }))
      .filter((x) => x.missing);
    if (incomplete.length) {
      throw new PurchaseError(
        `Informe ${incomplete
          .map((x) => `${x.missing} de "${categoryLabel(x.c)}"`)
          .join("; ")} antes de registrar o pagamento.`,
        400,
      );
    }

    await tx.purchaseEvent.update({
      where: { id },
      data: {
        paymentDate: toDbDate(paidDay),
        paymentReference: data.paymentReference,
      },
    });
  });
}

// Desfaz o pagamento (correção de um registro feito por engano): os valores voltam a
// ser editáveis. Só com a compra em andamento.
export async function undoPurchasePayment(id: string) {
  const undone = await prisma.purchaseEvent.updateMany({
    where: {
      id,
      paymentDate: { not: null },
      confirmedAt: null,
      cancelledAt: null,
    },
    data: { paymentDate: null, paymentReference: null },
  });
  if (undone.count !== 1) {
    throw new PurchaseError(
      "Só é possível desfazer o pagamento de uma compra paga e em andamento.",
      409,
    );
  }
}

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
