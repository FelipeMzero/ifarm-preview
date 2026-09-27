import { sessionStatus } from "@/lib/management-steps";
import type { Prisma } from "@/lib/prisma";
import { categoryLabel } from "../purchase/reception";

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

type ReceptionPurchase = Prisma.PurchaseEventGetPayload<{
  include: typeof receptionPurchaseInclude;
}>;

const day = (d: Date | null) => d?.toLocaleDateString("en-CA") ?? null;

export function toReceptionPurchaseDto(e: ReceptionPurchase) {
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
    managementDate: day(r.managementSession.managementDate),
    scheduledDate: day(r.managementSession.scheduledDate),
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
    purchaseDate: day(e.purchaseDate),
    notes: e.notes,
    seller: e.seller,
    // Recepções só em compras em andamento; consolidadas e canceladas são consulta.
    status: e.cancelledAt
      ? ("cancelled" as const)
      : e.confirmedAt
        ? ("confirmed" as const)
        : ("open" as const),
    categories,
    receptions,
    expectedQuantity: expected,
    receivedQuantity: received,
    hasOpenReception: receptions.some(
      (r) => r.status === "planned" || r.status === "in_progress",
    ),
  };
}

export type ReceptionPurchaseDto = ReturnType<typeof toReceptionPurchaseDto>;

// "A receber": compra em andamento que ainda não recebeu tudo o que foi negociado ou
// que tem uma recepção em aberto.
export function isPending(p: ReceptionPurchaseDto) {
  return (
    p.status === "open" &&
    (p.receivedQuantity < p.expectedQuantity || p.hasOpenReception)
  );
}
