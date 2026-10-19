import "server-only";
import {
  toDbDate,
  type BatchCreateData,
  type BatchReopenData,
  type BatchUpdateData,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { write } from "../db-errors";
import { BusinessError, NotFoundError, ValidationError } from "../errors";

const toTargetDate = (v?: string) => (v ? toDbDate(v) : null);

// Cria o lote já numa área livre (o lote sempre ocupa uma área) e, se houver, a meta de venda.
export async function createBatch(data: BatchCreateData, userId: string) {
  const { name, notes, hasMeta, targetDate, targetWeight, areaId } = data;
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id ?? "";

  const area = await prisma.area.findFirst({
    where: { id: areaId, propertyId, closedAt: null },
    select: { id: true },
  });
  if (!area) {
    throw new ValidationError("Área inválida.", {
      areaId: "Área inválida ou inativa para a propriedade selecionada.",
    });
  }

  const occupied = await prisma.batchAreaHistory.findFirst({
    where: { areaId, exitedAt: null, batch: { closedAt: null } },
    select: { id: true, batch: { select: { name: true } } },
  });
  if (occupied) {
    throw new ValidationError("Área ocupada.", {
      areaId: `A área selecionada já está ocupada pelo lote "${occupied.batch.name}".`,
    });
  }

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
    const area = await prisma.area.findFirst({
      where: { id: newAreaId, propertyId: current.propertyId, closedAt: null },
      select: { id: true },
    });
    if (!area) {
      throw new ValidationError("Área inválida.", {
        newAreaId: "Área inválida ou inativa para a propriedade selecionada.",
      });
    }

    const occupied = await prisma.batchAreaHistory.findFirst({
      where: {
        areaId: newAreaId,
        exitedAt: null,
        batchId: { not: id },
        batch: { closedAt: null },
      },
      select: { id: true, batch: { select: { name: true } } },
    });
    if (occupied) {
      throw new ValidationError("Área ocupada.", {
        newAreaId: `A área de destino já está ocupada pelo lote "${occupied.batch.name}".`,
      });
    }
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

export async function deleteBatch(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!batch) throw new NotFoundError("Lote não encontrado.");
  await write(() => prisma.batch.delete({ where: { id } }));
}

// Encerra um lote vazio e libera a área que ele ocupava. Lote com animais ativos ou
// destino de transferências pendentes não pode ser encerrado.
export async function closeBatch(id: string) {
  await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id },
      select: { closedAt: true },
    });
    if (!batch) throw new BusinessError("Lote não encontrado.", 404);
    if (batch.closedAt)
      throw new BusinessError("O lote já está encerrado.", 409);

    const animalCount = await tx.animal.count({
      where: { currentBatchId: id, status: "ACTIVE" },
    });
    if (animalCount > 0) {
      throw new BusinessError(
        `O lote ainda tem ${animalCount} animal(is). Transfira-os antes de encerrar.`,
        409,
        undefined,
        { code: "HAS_ANIMALS", animalCount },
      );
    }

    const pendingIncoming = await tx.animalBatchTransfer.count({
      where: { destinationBatchId: id, confirmedAt: null, cancelledAt: null },
    });
    if (pendingIncoming > 0) {
      throw new BusinessError(
        `O lote é destino de ${pendingIncoming} transferência(s) pendente(s). Cancele-as ou altere o destino antes de encerrar.`,
        409,
        undefined,
        { code: "HAS_PENDING_TRANSFERS", pendingIncoming },
      );
    }

    const now = new Date();
    // Condicional ao status para não encerrar duas vezes em requisições simultâneas.
    const closed = await tx.batch.updateMany({
      where: { id, closedAt: null },
      data: { closedAt: now },
    });
    if (closed.count !== 1) {
      throw new BusinessError("O lote já está encerrado.", 409);
    }

    await tx.batchAreaHistory.updateMany({
      where: { batchId: id, exitedAt: null },
      data: { exitedAt: now },
    });
  });
}

// Reativa um lote encerrado numa área livre. Abre um novo registro de área (em vez
// de reabrir o antigo) para o período encerrado continuar visível no histórico.
export async function reopenBatch(id: string, data: BatchReopenData) {
  const { areaId, notes } = data;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id },
      select: { closedAt: true, propertyId: true },
    });
    if (!batch) throw new BusinessError("Lote não encontrado.", 404);
    if (!batch.closedAt) {
      throw new BusinessError("O lote não está encerrado.", 409);
    }

    const area = await tx.area.findFirst({
      where: { id: areaId, propertyId: batch.propertyId, closedAt: null },
      select: { id: true },
    });
    if (!area) {
      throw new BusinessError("Área inválida.", 400, undefined, {
        errors: {
          areaId: "Área inválida ou inativa para a propriedade do lote.",
        },
      });
    }

    const occupied = await tx.batchAreaHistory.findFirst({
      where: {
        areaId,
        exitedAt: null,
        batchId: { not: id },
        batch: { closedAt: null },
      },
      select: { batch: { select: { name: true } } },
    });
    if (occupied) {
      throw new BusinessError("Área ocupada.", 400, undefined, {
        errors: {
          areaId: `A área selecionada já está ocupada pelo lote "${occupied.batch.name}".`,
        },
      });
    }

    // Condicional ao status para não reativar duas vezes em requisições simultâneas.
    const reopened = await tx.batch.updateMany({
      where: { id, closedAt: { not: null } },
      data: { closedAt: null },
    });
    if (reopened.count !== 1) {
      throw new BusinessError("O lote não está encerrado.", 409);
    }

    await tx.batchAreaHistory.create({
      data: { batchId: id, areaId, enteredAt: new Date(), notes },
    });
  });
}
