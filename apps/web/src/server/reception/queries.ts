import "server-only";
import { z } from "zod";
import {
  fromLocalDay,
  isSessionOpen,
  type ReceptionPurchase,
  type ReceptionPurchaseListResult,
  fromDbDate,
} from "@ifarm/shared";
import type { Prisma } from "@/server/db";
import { prisma } from "@/server/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import { categoryLabel } from "../purchase/reception";
import { purchaseStatus } from "../purchase/rules";
import { isPending } from "./rules";
import { sessionStatus } from "@/server/management-session/session-steps";

// Área de recepções: dados físicos da compra (quem vende, o que foi negociado em
// quantidade, o que já chegou). Nada de preços, custos ou situação financeira.
const receptionPurchaseInclude = {
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

function toReceptionPurchase(e: ReceptionPurchaseRow): ReceptionPurchase {
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

export const receptionPurchaseQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  // "pending" = a receber (padrão); "all" = todas as não canceladas.
  filter: z.enum(["pending", "all"]).optional().default("pending"),
});

export type ReceptionPurchaseQuery = z.infer<
  typeof receptionPurchaseQuerySchema
>;

// Compras da propriedade vistas pela área de recepções (sem valores).
export async function listReceptionPurchases(
  { propertyId, page, pageSize, search, filter }: ReceptionPurchaseQuery,
  userId: string,
): Promise<ReceptionPurchaseListResult> {
  const resolvedPropertyId =
    propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!resolvedPropertyId) return { data: [], total: 0, pageCount: 0 };

  // "A receber" depende das contagens: filtra depois de montar (volume pequeno).
  const events = await prisma.purchaseEvent.findMany({
    where: {
      destinationPropertyId: resolvedPropertyId,
      cancelledAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { seller: { name: { contains: search, mode: "insensitive" } } },
              {
                receptions: {
                  some: {
                    gtaNumber: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: receptionPurchaseInclude,
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
  });

  const all = events.map(toReceptionPurchase);
  const rows = filter === "pending" ? all.filter(isPending) : all;

  return {
    data: rows.slice(page * pageSize, (page + 1) * pageSize),
    total: rows.length,
    page,
    pageSize,
    pageCount: Math.ceil(rows.length / pageSize),
  };
}

// Uma compra vista pela área de recepções: categorias com recebidos/esperados e as
// recepções (viagens), sem valores.
export async function getReceptionPurchase(
  id: string,
): Promise<ReceptionPurchase> {
  const event = await prisma.purchaseEvent.findUnique({
    where: { id },
    include: receptionPurchaseInclude,
  });
  if (!event) throw new NotFoundError("Compra não encontrada.");
  return toReceptionPurchase(event);
}
