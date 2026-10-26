import type { BatchUpdateData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { NotFoundError } from "@ifarm/domain/errors";
import { assertAreaAvailable } from "../../area/availability";
import { toTargetDate } from "../shared";

// Altera nome, observações e meta; com `newAreaId`, move o lote para outra área livre.
export async function updateBatch(id: string, data: BatchUpdateData) {
  const {
    name,
    notes,
    hasMeta,
    targetDate,
    targetWeight,
    newAreaId,
    areaChangeDescription,
  } = data;

  const current = await prisma.batch.findUnique({
    where: { id },
    include: {
      saleGoal: true,
      batchAreaHistories: {
        where: { exitedAt: null },
        take: 1,
        orderBy: { enteredAt: "desc" },
      },
    },
  });
  if (!current) throw new NotFoundError("Lote não encontrado.");

  if (newAreaId) {
    await assertAreaAvailable(prisma, {
      areaId: newAreaId,
      propertyId: current.propertyId,
      exceptBatchId: id,
      field: "newAreaId",
    });
  }

  await write(() =>
    prisma.$transaction(async (tx) => {
      await tx.batch.update({ where: { id }, data: { name, notes } });

      const goal = { targetDate: toTargetDate(targetDate), targetWeight };
      if (hasMeta) {
        if (current.saleGoal) {
          await tx.batchSaleGoal.update({ where: { batchId: id }, data: goal });
        } else {
          await tx.batchSaleGoal.create({ data: { batchId: id, ...goal } });
        }
      } else if (current.saleGoal) {
        await tx.batchSaleGoal.delete({ where: { batchId: id } });
      }

      if (newAreaId) {
        const activeHistory = current.batchAreaHistories[0];
        if (activeHistory) {
          await tx.batchAreaHistory.update({
            where: { id: activeHistory.id },
            data: { exitedAt: new Date() },
          });
        }

        await tx.batchAreaHistory.create({
          data: {
            batchId: id,
            areaId: newAreaId,
            enteredAt: new Date(),
            notes: areaChangeDescription,
          },
        });
      }
    }),
  );
}
