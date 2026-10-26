import type { BatchDetail } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";

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
