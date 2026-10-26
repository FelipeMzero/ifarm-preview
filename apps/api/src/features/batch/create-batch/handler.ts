import type { BatchCreateData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertAreaAvailable } from "@ifarm/domain/area/queries";
import { getOrAssignCurrentProperty } from "@ifarm/domain/current-property/queries";
import { write } from "@ifarm/domain/db-errors";
import { toTargetDate } from "../shared";

// Cria o lote já numa área livre (o lote sempre ocupa uma área) e, se houver, a meta de venda.
export async function createBatch(data: BatchCreateData, userId: string) {
  const { name, notes, hasMeta, targetDate, targetWeight, areaId } = data;
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id ?? "";

  await assertAreaAvailable(prisma, { areaId, propertyId, field: "areaId" });

  const batch = await write(() =>
    prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({
        data: { name, notes, propertyId },
      });

      if (hasMeta) {
        await tx.batchSaleGoal.create({
          data: {
            batchId: created.id,
            targetDate: toTargetDate(targetDate),
            targetWeight,
          },
        });
      }

      await tx.batchAreaHistory.create({
        data: { batchId: created.id, areaId, enteredAt: new Date(), notes },
      });

      return created;
    }),
  );
  return { id: batch.id };
}
