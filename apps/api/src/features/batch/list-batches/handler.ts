import type { BatchListResult, BatchQuery } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { getOrAssignCurrentProperty } from "../../current-property/shared";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone";

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
  const timeZone = await propertyTimeZone(propertyId);
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
      targetDate: fromDbDate(b.saleGoal?.targetDate),
      targetWeight: b.saleGoal?.targetWeight?.toNumber() ?? null,
      area: b.batchAreaHistories[0]?.area ?? null,
      animalCount: b._count.animals,
      avgWeightKg: avgByBatch.get(b.id)?.toNumber() ?? null,
      closedAt: toZonedIso(b.closedAt, timeZone),
      updatedAt: toZonedIso(b.updatedAt, timeZone),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}
