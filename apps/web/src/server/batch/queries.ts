import "server-only";
import { z } from "zod";
import {
  fromDbDate,
  fromLocalDateTime,
  type BatchDetail,
  type BatchFullDetails,
  type BatchListResult,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { sortWeighings, toWeighingDto } from "../animal/weighings";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import { effectiveWeighing } from "../management-session/effective";
import { stockingPreview } from "../stocking/queries";
import { averageDailyGain, groupPurchases, weightSeries } from "./rules";

export const batchQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type BatchQuery = z.infer<typeof batchQuerySchema>;

function buildWhere(query: BatchQuery, propertyId: string) {
  const where: Record<string, unknown> = { propertyId };

  if (query.status === "active") {
    where.closedAt = null;
  } else if (query.status === "inactive") {
    where.closedAt = { not: null };
  }

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  return where;
}

// Lotes da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listBatches(
  query: BatchQuery,
  userId: string,
): Promise<BatchListResult | { data: [] }> {
  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [] };

  const where = buildWhere(query, propertyId);
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      include: {
        saleGoal: true,
        batchAreaHistories: {
          where: { exitedAt: null },
          take: 1,
          orderBy: { enteredAt: "desc" },
          include: { area: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            animals: {
              where: { status: { in: ["ACTIVE"] } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: query.page * query.pageSize,
      take: query.pageSize,
    }),
    prisma.batch.count({ where }),
  ]);

  const batchIds = batches.map((b) => b.id);
  const weightAgg = await prisma.animal.groupBy({
    by: ["currentBatchId"],
    where: { currentBatchId: { in: batchIds } },
    _avg: { currentWeight: true },
  });
  const avgByBatch = new Map(
    weightAgg.map((w) => [w.currentBatchId, w._avg.currentWeight]),
  );

  return {
    data: batches.map((b) => ({
      id: b.id,
      name: b.name,
      notes: b.notes,
      hasMeta: Boolean(b.saleGoal),
      targetDate: b.saleGoal?.targetDate
        ? fromDbDate(b.saleGoal.targetDate)
        : null,
      targetWeight: b.saleGoal?.targetWeight?.toNumber() ?? null,
      area: b.batchAreaHistories[0]?.area ?? null,
      animalCount: b._count.animals,
      avgWeightKg: avgByBatch.get(b.id)?.toNumber() ?? null,
      closedAt: b.closedAt?.toISOString() ?? null,
      updatedAt: b.updatedAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

// Lote para edição: meta de venda, área atual e histórico de áreas.
export async function getBatch(id: string): Promise<BatchDetail> {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      saleGoal: true,
      batchAreaHistories: {
        orderBy: { enteredAt: "desc" },
        include: { area: { select: { id: true, name: true } } },
      },
    },
  });
  if (!batch) throw new NotFoundError("Lote não encontrado.");

  const activeHistory = batch.batchAreaHistories.find(
    (h) => h.exitedAt === null,
  );

  return {
    id: batch.id,
    name: batch.name,
    notes: batch.notes ?? "",
    hasMeta: Boolean(batch.saleGoal),
    targetDate: batch.saleGoal?.targetDate
      ? fromDbDate(batch.saleGoal.targetDate)
      : null,
    targetWeight: batch.saleGoal?.targetWeight?.toNumber() ?? null,
    currentArea: activeHistory?.area ?? null,
    areaHistory: batch.batchAreaHistories.map((h) => ({
      id: h.id,
      area: h.area,
      enteredAt: h.enteredAt.toISOString(),
      exitedAt: h.exitedAt?.toISOString() ?? null,
      notes: h.notes ?? null,
    })),
    closedAt: batch.closedAt?.toISOString() ?? null,
    updatedAt: batch.updatedAt.toISOString(),
  };
}

// Painel do lote: animais com GMD, peso médio ao longo do tempo, movimentações,
// transferências pendentes e confirmadas, compras de entrada e lotação da área.
export async function getBatchDetails(id: string): Promise<BatchFullDetails> {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      saleGoal: true,
      property: { select: { id: true, name: true } },
      batchAreaHistories: {
        orderBy: { enteredAt: "desc" },
        include: {
          area: {
            select: {
              id: true,
              name: true,
              hectares: true,
              stockingRate: true,
            },
          },
        },
      },
    },
  });

  if (!batch) throw new NotFoundError("Lote não encontrado.");

  // Transferências de sessão de manejo ainda não consolidada ficam de fora.
  const pendingWhere = {
    confirmedAt: null,
    cancelledAt: null,
    managementSessionId: null,
  };

  const [
    animals,
    movements,
    incomingPending,
    outgoingPending,
    confirmedIncoming,
    confirmedOutgoing,
    purchases,
    stocking,
  ] = await Promise.all([
    prisma.animal.findMany({
      where: { currentBatchId: id, status: "ACTIVE" },
      include: {
        breed: { select: { name: true } },
        animalWeighings: {
          where: { cancelledAt: null, ...effectiveWeighing },
        },
        animalBatchHistories: {
          where: { batchId: id, exitedAt: null },
          select: { enteredAt: true },
          take: 1,
        },
      },
    }),
    prisma.animalBatchHistory.findMany({
      where: { batchId: id },
      orderBy: { enteredAt: "desc" },
      include: {
        animal: {
          select: {
            id: true,
            code: true,
            currentTag: true,
            currentRfid: true,
          },
        },
      },
    }),
    prisma.animalBatchTransfer.findMany({
      where: { ...pendingWhere, destinationBatchId: id },
      orderBy: { transferDate: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    // Planos para outros lotes que incluem animais que hoje estão neste lote.
    prisma.animalBatchTransfer.findMany({
      where: {
        ...pendingWhere,
        destinationBatchId: { not: id },
        items: { some: { animal: { currentBatchId: id } } },
      },
      orderBy: { transferDate: "asc" },
      include: {
        destinationBatch: { select: { id: true, name: true } },
        items: {
          where: { animal: { currentBatchId: id } },
          select: { id: true },
        },
      },
    }),
    prisma.animalBatchTransfer.findMany({
      where: { destinationBatchId: id, confirmedAt: { not: null } },
      include: { _count: { select: { items: true } } },
    }),
    prisma.animalBatchTransfer.findMany({
      where: {
        confirmedAt: { not: null },
        items: { some: { originBatchId: id } },
      },
      include: {
        destinationBatch: { select: { name: true } },
        items: { where: { originBatchId: id }, select: { id: true } },
      },
    }),
    prisma.purchaseReception.findMany({
      where: { entryBatchId: id, purchaseEvent: { cancelledAt: null } },
      select: {
        purchaseEvent: {
          select: {
            id: true,
            purchaseDate: true,
            confirmedAt: true,
            seller: { select: { id: true, name: true } },
          },
        },
        _count: { select: { purchasedAnimals: true } },
      },
    }),
    stockingPreview({ batchId: id }),
  ]);

  const weighingsByAnimal = animals.map((a) => ({
    weighings: sortWeighings(a.animalWeighings.map(toWeighingDto)).map((w) => ({
      date: w.date,
      weightKg: w.weightKg,
    })),
  }));

  const animalDtos = animals.map((a, i) => {
    const { weighings } = weighingsByAnimal[i];
    return {
      id: a.id,
      code: a.code,
      earTag: a.currentTag,
      rfid: a.currentRfid,
      name: a.name,
      sex: a.sex,
      neutered: a.neutered,
      birthDate: a.birthDate ? fromDbDate(a.birthDate) : null,
      breedName: a.breed?.name ?? null,
      currentWeightKg: a.currentWeight?.toNumber() ?? null,
      lastWeighingDate: weighings.at(-1)?.date ?? null,
      adgKgPerDay: averageDailyGain(weighings),
      enteredAt: a.animalBatchHistories[0]?.enteredAt.toISOString() ?? null,
    };
  });

  const currentArea = batch.batchAreaHistories.find((h) => !h.exitedAt);

  return {
    id: batch.id,
    name: batch.name,
    notes: batch.notes,
    closedAt: batch.closedAt?.toISOString() ?? null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    property: batch.property,
    saleGoal: batch.saleGoal
      ? {
          targetDate: batch.saleGoal.targetDate
            ? fromDbDate(batch.saleGoal.targetDate)
            : null,
          targetWeightKg: batch.saleGoal.targetWeight?.toNumber() ?? null,
        }
      : null,
    currentArea: currentArea
      ? {
          id: currentArea.area.id,
          name: currentArea.area.name,
          hectares: currentArea.area.hectares.toNumber(),
          stockingRate: currentArea.area.stockingRate.toNumber(),
          enteredAt: currentArea.enteredAt.toISOString(),
        }
      : null,
    areaHistory: batch.batchAreaHistories.map((h) => ({
      id: h.id,
      area: { id: h.area.id, name: h.area.name },
      enteredAt: h.enteredAt.toISOString(),
      exitedAt: h.exitedAt?.toISOString() ?? null,
      notes: h.notes,
    })),
    stocking: stocking
      ? {
          capacityUa: stocking.capacityUa,
          currentUa: stocking.current.ua,
          estimatedCount: stocking.current.estimatedCount,
        }
      : null,
    animals: animalDtos,
    weightSeries: weightSeries(weighingsByAnimal, batch.createdAt),
    movements: movements.map((m) => ({
      id: m.id,
      animal: {
        id: m.animal.id,
        code: m.animal.code,
        earTag: m.animal.currentTag,
        rfid: m.animal.currentRfid,
      },
      enteredAt: m.enteredAt.toISOString(),
      exitedAt: m.exitedAt?.toISOString() ?? null,
      notes: m.notes,
    })),
    pendingTransfers: {
      incoming: incomingPending.map((t) => ({
        id: t.id,
        transferDate: fromLocalDateTime(t.transferDate),
        animalCount: t._count.items,
        notes: t.notes,
      })),
      outgoing: outgoingPending.map((t) => ({
        id: t.id,
        transferDate: fromLocalDateTime(t.transferDate),
        destinationBatch: t.destinationBatch,
        animalCount: t.items.length,
        notes: t.notes,
      })),
    },
    confirmedTransfers: [
      ...confirmedIncoming.map((t) => ({
        id: t.id,
        direction: "in" as const,
        date: t.confirmedAt!.toISOString(),
        animalCount: t._count.items,
        otherBatchName: null,
      })),
      ...confirmedOutgoing.map((t) => ({
        id: t.id,
        direction: "out" as const,
        date: t.confirmedAt!.toISOString(),
        animalCount: t.items.length,
        otherBatchName: t.destinationBatch.name,
      })),
    ],
    purchases: groupPurchases(purchases),
  };
}
