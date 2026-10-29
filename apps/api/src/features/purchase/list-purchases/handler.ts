import type { PurchaseListResult, PurchaseQuery } from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { categoryLabel } from "../reception.public";
import { estimatedCategoryValue, sumIfAllKnown } from "../rules";
import { PURCHASE_STATUS_WHERE, purchaseStatus } from "../status.public";

function buildWhere(query: PurchaseQuery, propertyId: string) {
  const where: Prisma.PurchaseEventWhereInput = {
    destinationPropertyId: propertyId,
    ...PURCHASE_STATUS_WHERE[query.status ?? "open"],
  };

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    where.OR = [
      { title: contains },
      { seller: { name: contains } },
      { notes: contains },
      { receptions: { some: { gtaNumber: contains } } },
      { receptions: { some: { invoiceNumber: contains } } },
    ];
  }

  return where;
}

// Compras da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listPurchases(
  query: PurchaseQuery,
): Promise<PurchaseListResult> {
  const { propertyId } = query;
  const where = buildWhere(query, propertyId);
  const [events, total] = await Promise.all([
    prisma.purchaseEvent.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true } },
        categories: {
          include: {
            breed: { select: { name: true } },
            _count: { select: { animals: true } },
          },
        },
        _count: { select: { purchasedAnimals: true, receptions: true } },
      },
      orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
      skip: query.page * query.pageSize,
      take: query.pageSize,
    }),
    prisma.purchaseEvent.count({ where }),
  ]);

  return {
    data: events.map((e) => {
      const values = e.categories.map((c) =>
        estimatedCategoryValue(c, e.confirmedAt != null, c._count.animals),
      );
      return {
        id: e.id,
        title: e.title,
        purchaseDate: fromDbDate(e.purchaseDate),
        seller: e.seller,
        categories: e.categories.map(
          (c) => `${c.expectedQuantity} ${categoryLabel(c)}`,
        ),
        expectedQuantity: e.categories.reduce(
          (s, c) => s + c.expectedQuantity,
          0,
        ),
        receivedQuantity: e._count.purchasedAnimals,
        receptionCount: e._count.receptions,
        value: sumIfAllKnown(values),
        status: purchaseStatus(e),
        paid: e.paymentDate != null,
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}
