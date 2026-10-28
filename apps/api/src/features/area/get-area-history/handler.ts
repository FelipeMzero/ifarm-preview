import {
  instantToZonedIso,
  type AreaOccupancyHistoryEntry,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { asTimeZone, toZonedIso } from "../../property/time-zone.public";

// Lotes que ocuparam a área, do mais recente para o mais antigo; entradas e saídas no fuso da
// propriedade.
export async function getAreaOccupancyHistory(
  areaId: string,
): Promise<AreaOccupancyHistoryEntry[]> {
  const histories = await prisma.batchAreaHistory.findMany({
    where: { areaId },
    orderBy: { enteredAt: "desc" },
    include: {
      batch: { select: { id: true, name: true } },
      area: { select: { property: { select: { timeZone: true } } } },
    },
  });

  return histories.map((h) => {
    const timeZone = asTimeZone(h.area.property.timeZone);
    return {
      id: h.id,
      batch: h.batch,
      enteredAt: instantToZonedIso(h.enteredAt, timeZone),
      exitedAt: toZonedIso(h.exitedAt, timeZone),
      notes: h.notes,
    };
  });
}
