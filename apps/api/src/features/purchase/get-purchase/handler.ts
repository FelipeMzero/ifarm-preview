import { fromLocalDay, type PurchaseDetail } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "@ifarm/domain/db-dates";
import { NotFoundError } from "@ifarm/domain/errors";
import { sessionStatus } from "../../management-session/session-steps";
import { arrivalWeightsByCategory } from "../costs";
import { categoryLabel } from "../reception";
import {
  estimatedCategoryValue,
  purchaseStatus,
  sumIfAllKnown,
} from "../rules";

const num = (d: { toNumber(): number } | null) => d?.toNumber() ?? null;
const day = (d: Date | null) => (d ? fromLocalDay(d) : null);

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
