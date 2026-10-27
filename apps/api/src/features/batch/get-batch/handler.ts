import { instantToZonedIso, type BatchDetail } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone";

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
  // Entradas e saídas de área: eventos da propriedade, no fuso dela.
  const timeZone = await propertyTimeZone(batch.propertyId);

  const activeHistory = batch.batchAreaHistories.find(
    (h) => h.exitedAt === null,
  );

  return {
    id: batch.id,
    name: batch.name,
    notes: batch.notes ?? "",
    hasMeta: Boolean(batch.saleGoal),
    targetDate: fromDbDate(batch.saleGoal?.targetDate),
    targetWeight: batch.saleGoal?.targetWeight?.toNumber() ?? null,
    currentArea: activeHistory?.area ?? null,
    areaHistory: batch.batchAreaHistories.map((h) => ({
      id: h.id,
      area: h.area,
      enteredAt: instantToZonedIso(h.enteredAt, timeZone),
      exitedAt: toZonedIso(h.exitedAt, timeZone),
      notes: h.notes ?? null,
    })),
    closedAt: toZonedIso(batch.closedAt, timeZone),
    updatedAt: toZonedIso(batch.updatedAt, timeZone),
  };
}
