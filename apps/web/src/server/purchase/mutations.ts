import "server-only";
import {
  toLocalDay,
  today,
  type PurchaseData,
  type PurchasePaymentData,
} from "@ifarm/shared";
import { prisma } from "@/lib/prisma";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { allocatePurchaseCosts } from "./costs";
import { categoryLabel } from "./reception";
import { missingValue, PurchaseError, sameValue } from "./rules";

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
      purchaseDate: toLocalDay(data.purchaseDate),
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
    if (event.confirmedAt || event.cancelledAt) {
      throw new PurchaseError(
        "Somente compras em andamento podem ser alteradas.",
        409,
      );
    }

    const keptIds = new Set(
      data.categories.map((c) => c.id).filter((v) => v != null),
    );
    const removed = event.categories.filter((c) => !keptIds.has(c.id));
    const existingIds = new Set(event.categories.map((c) => c.id));
    const added = data.categories.filter(
      (c) => c.id == null || !existingIds.has(c.id),
    );

    if (event.paidAt) {
      const changedValue = data.categories.some((c) => {
        const saved = event.categories.find((s) => s.id === c.id);
        return saved && !sameValue(saved, c);
      });
      if (
        data.sellerId !== event.sellerId ||
        removed.length ||
        added.length ||
        changedValue
      ) {
        throw new PurchaseError(
          "A compra já foi paga: vendedor, categorias e valores não podem mudar. Desfaça o pagamento para corrigir.",
          409,
        );
      }
    }

    const seller = await tx.person.findFirst({
      where: { id: data.sellerId, deactivatedAt: null },
      select: { id: true },
    });
    if (!seller && data.sellerId !== event.sellerId) {
      throw new PurchaseError("Vendedor inválido.", 400, "sellerId");
    }

    const withAnimals = removed.filter((c) => c._count.animals > 0);
    if (withAnimals.length) {
      throw new PurchaseError(
        `Não é possível remover categorias com animais recebidos (${withAnimals
          .map((c) => `${c._count.animals} animal(is)`)
          .join(", ")}).`,
        409,
        "categories",
      );
    }
    if (removed.length) {
      await tx.purchaseCategory.deleteMany({
        where: { id: { in: removed.map((c) => c.id) } },
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
        purchaseDate: toLocalDay(data.purchaseDate),
        notes: data.notes,
        sellerId: data.sellerId,
      },
    });
  });
}

// Registra o pagamento de uma compra em andamento (data informada ou hoje). Exige o
// valor de todas as categorias conhecido; a partir daí os valores ficam bloqueados.
export async function payPurchase(id: string, data: PurchasePaymentData) {
  const paidDay = data.paidAt ?? today();
  if (paidDay > today()) {
    throw new PurchaseError(
      "A data do pagamento não pode ser futura.",
      400,
      "paidAt",
    );
  }

  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: { categories: { include: { breed: true } } },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);
    if (event.confirmedAt || event.cancelledAt || event.paidAt) {
      throw new PurchaseError(
        "Só é possível registrar o pagamento de uma compra em andamento e ainda não paga.",
        409,
      );
    }

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
        paidAt: toLocalDay(paidDay),
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
      paidAt: { not: null },
      confirmedAt: null,
      cancelledAt: null,
    },
    data: { paidAt: null, paymentReference: null },
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
    if (event.confirmedAt || event.cancelledAt) {
      throw new PurchaseError(
        "Somente compras em andamento podem ser consolidadas.",
        409,
      );
    }
    if (!event.paidAt) {
      throw new PurchaseError(
        "Registre o pagamento antes de consolidar a compra.",
        409,
      );
    }
    if (!event._count.purchasedAnimals) {
      throw new PurchaseError(
        "A compra não tem animais recebidos. Sem animais, cancele a compra.",
        409,
      );
    }
    const open = event.receptions.filter(
      (r) =>
        !r.managementSession.confirmedAt && !r.managementSession.cancelledAt,
    );
    if (open.length) {
      throw new PurchaseError(
        `Há ${open.length} recepção(ões) em aberto. Conclua ou cancele antes de consolidar.`,
        409,
      );
    }

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
    if (event.cancelledAt) {
      throw new PurchaseError("A compra já está cancelada.", 409);
    }
    if (event.confirmedAt) {
      throw new PurchaseError(
        "Uma compra consolidada não pode ser cancelada.",
        409,
      );
    }
    if (event.paidAt) {
      throw new PurchaseError("Uma compra paga não pode ser cancelada.", 409);
    }
    if (event._count.purchasedAnimals) {
      throw new PurchaseError(
        `A compra tem ${event._count.purchasedAnimals} animal(is) recebido(s) e não pode ser cancelada. Remova-os das recepções antes.`,
        409,
      );
    }

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
