import "server-only";
import type { PurchaseQuery } from "@ifarm/shared";
import {
  fromLocalDay,
  type PurchaseDetail,
  type PurchaseListResult,
} from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import { arrivalWeightsByCategory } from "./costs";
import { categoryLabel } from "./reception";
import {
  estimatedCategoryValue,
  PURCHASE_STATUS_WHERE,
  purchaseStatus,
  sumIfAllKnown,
} from "./rules";
import { sessionStatus } from "../management-session/session-steps";
import { fromDbDate } from "../db-dates";

const num = (d: { toNumber(): number } | null) => d?.toNumber() ?? null;
const day = (d: Date | null) => (d ? fromLocalDay(d) : null);

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
  userId: string,
): Promise<PurchaseListResult> {
  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [], total: 0, pageCount: 0 };

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

export async function getPurchase(id: string): Promise<PurchaseDetail> {
  const event = await prisma.purchaseEvent.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true } },
      destinationProperty: { select: { id: true, name: true } },
      categories: {
        orderBy: { id: "asc" },
        include: {
          breed: { select: { id: true, name: true } },
          animals: { select: { cost: true } },
        },
      },
      receptions: {
        orderBy: { createdAt: "asc" },
        include: {
          entryBatch: { select: { id: true, name: true } },
          managementSession: true,
          _count: { select: { purchasedAnimals: true } },
        },
      },
    },
  });
  if (!event) throw new NotFoundError("Compra não encontrada.");

  const arrival = await arrivalWeightsByCategory(prisma, id);

  const categories = event.categories.map((c) => {
    const costs = c.animals.map((a) => num(a.cost));
    return {
      id: c.id,
      label: categoryLabel(c),
      sex: c.sex,
      minAgeMonths: c.minAgeMonths,
      maxAgeMonths: c.maxAgeMonths,
      breed: c.breed,
      expectedQuantity: c.expectedQuantity,
      pricingType: c.pricingType,
      unitPrice: num(c.unitPrice),
      totalPrice: num(c.totalPrice),
      invoicedWeight: num(c.invoicedWeight),
      shrinkPercent: num(c.shrinkPercent),
      costSplit: c.costSplit,
      notes: c.notes,
      receivedQuantity: c.animals.length,
      estimatedValue: estimatedCategoryValue(
        c,
        event.confirmedAt != null,
        c.animals.length,
      ),
      // Soma do peso de chegada dos recebidos (sugestão do peso por arroba).
      arrivalWeight: arrival.get(c.id) ?? {
        totalKg: 0,
        weighed: 0,
        received: 0,
      },
      // Soma dos custos rateados (só existe com a compra consolidada).
      costTotal: costs.length ? sumIfAllKnown(costs) : null,
    };
  });

  return {
    id: event.id,
    title: event.title,
    status: purchaseStatus(event),
    purchaseDate: fromDbDate(event.purchaseDate),
    notes: event.notes ?? "",
    seller: event.seller,
    destinationProperty: event.destinationProperty,
    paymentDate: event.paymentDate ? fromDbDate(event.paymentDate) : null,
    paymentReference: event.paymentReference,
    confirmedAt: event.confirmedAt?.toISOString() ?? null,
    cancelledAt: event.cancelledAt?.toISOString() ?? null,
    updatedAt: event.updatedAt.toISOString(),
    categories,
    receptions: event.receptions.map((r) => ({
      id: r.id,
      sessionId: r.managementSessionId,
      title: r.managementSession.title,
      status: sessionStatus(r.managementSession),
      scheduledAt: fromLocalDay(r.managementSession.scheduledAt),
      performedAt: day(r.managementSession.performedAt),
      entryBatch: r.entryBatch,
      gtaNumber: r.gtaNumber,
      invoiceNumber: r.invoiceNumber,
      animalCount: r._count.purchasedAnimals,
    })),
  };
}
