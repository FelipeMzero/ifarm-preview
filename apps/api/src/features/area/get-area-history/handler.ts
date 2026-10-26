import type { AreaOccupancyHistoryEntry } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

// Lotes que ocuparam a área, do mais recente para o mais antigo.
export async function getAreaOccupancyHistory(
  areaId: string,
): Promise<AreaOccupancyHistoryEntry[]> {
  const histories = await prisma.batchAreaHistory.findMany({
    where: { areaId },
    orderBy: { enteredAt: "desc" },
    include: { batch: { select: { id: true, name: true } } },
  });

  return histories.map((h) => ({
    id: h.id,
    batch: h.batch,
    enteredAt: h.enteredAt.toISOString(),
    exitedAt: h.exitedAt?.toISOString() ?? null,
    notes: h.notes,
  }));
}
