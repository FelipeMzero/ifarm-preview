import {
  fromLocalDay,
  isSessionOpen,
  type ReceptionPurchase,
} from "@ifarm/shared";
import type { Prisma } from "@ifarm/db";
import { categoryLabel } from "@ifarm/domain/purchase/reception";
import { purchaseStatus } from "@ifarm/domain/purchase/rules";
import { sessionStatus } from "@ifarm/domain/management-session/session-steps";
import { fromDbDate } from "@ifarm/domain/db-dates";

// Usados por mais de uma operação de recepção.

// Área de recepções: dados físicos da compra (quem vende, o que foi negociado em
// quantidade, o que já chegou). Nada de preços, custos ou situação financeira.
export const receptionPurchaseInclude = {
  seller: { select: { id: true, name: true } },
  categories: {
    orderBy: { id: "asc" },
    include: {
      breed: { select: { id: true, name: true } },
      _count: { select: { animals: true } },
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
} satisfies Prisma.PurchaseEventInclude;

type ReceptionPurchaseRow = Prisma.PurchaseEventGetPayload<{
  include: typeof receptionPurchaseInclude;
}>;

const day = (d: Date | null) => (d ? fromLocalDay(d) : null);

export function toReceptionPurchase(
  e: ReceptionPurchaseRow,
): ReceptionPurchase {
  const categories = e.categories.map((c) => ({
    id: c.id,
    label: categoryLabel(c),
    expectedQuantity: c.expectedQuantity,
    receivedQuantity: c._count.animals,
  }));
  const receptions = e.receptions.map((r) => ({
    id: r.id,
    sessionId: r.managementSessionId,
    title: r.managementSession.title,
    status: sessionStatus(r.managementSession),
    performedAt: day(r.managementSession.performedAt),
    scheduledAt: fromLocalDay(r.managementSession.scheduledAt),
    entryBatch: r.entryBatch,
    gtaNumber: r.gtaNumber,
    invoiceNumber: r.invoiceNumber,
    animalCount: r._count.purchasedAnimals,
  }));
  const expected = categories.reduce((s, c) => s + c.expectedQuantity, 0);
  const received = categories.reduce((s, c) => s + c.receivedQuantity, 0);
  return {
    id: e.id,
    title: e.title,
    purchaseDate: fromDbDate(e.purchaseDate),
    notes: e.notes,
    seller: e.seller,
    // Recepções só em compras em andamento; consolidadas e canceladas são consulta.
    status: purchaseStatus(e),
    categories,
    receptions,
    expectedQuantity: expected,
    receivedQuantity: received,
    hasOpenReception: receptions.some((r) => isSessionOpen(r.status)),
  };
}
