import { z } from "zod";
import { confirmTransferInTx } from "../../batch-transfer/confirmTransfer";
import {
  defineStep,
  StepError,
  stepNotesSchema,
  type SessionCtx,
  type Tx,
} from "./types";

// Transferências da sessão ainda abertas (uma por lote de destino).
const openTransfers = (sessionId: string) => ({
  managementSessionId: sessionId,
  confirmedAt: null,
  cancelledAt: null,
});

async function removeAnimal(tx: Tx, session: SessionCtx, animalId: string) {
  await tx.animalBatchTransferItem.deleteMany({
    where: { animalId, transfer: openTransfers(session.id) },
  });
  // Transferências que ficaram vazias não têm mais razão de existir.
  await tx.animalBatchTransfer.deleteMany({
    where: { ...openTransfers(session.id), items: { none: {} } },
  });
  await tx.managementParticipant.updateMany({
    where: { managementSessionId: session.id, animalId },
    data: { batchKept: false },
  });
}

export const batchStep = defineStep({
  type: "batch",
  // Por último: a transferência valida o animal depois dos demais manejos.
  consolidateOrder: 90,

  planSchema: z.object({
    type: z.literal("batch"),
    suggestedBatchIds: z.array(z.uuid()).default([]),
  }),

  async prepare(tx, session, plan) {
    const ids = [...new Set(plan.suggestedBatchIds)];
    const valid = await tx.batch.findMany({
      where: {
        id: { in: ids },
        propertyId: session.propertyId,
        closedAt: null,
      },
      select: { id: true },
    });
    if (valid.length !== ids.length) {
      throw new StepError(
        "Algum dos lotes sugeridos para a apartação é inválido ou está encerrado.",
      );
    }
    return { type: "batch" as const, suggestedBatchIds: ids };
  },

  async dispose(tx, session) {
    const [items, kept] = await Promise.all([
      tx.animalBatchTransferItem.count({
        where: { transfer: openTransfers(session.id) },
      }),
      tx.managementParticipant.count({
        where: { managementSessionId: session.id, batchKept: true },
      }),
    ]);
    if (items + kept) {
      throw new StepError(
        `A apartação já foi registrada em ${items + kept} animal(is). Desfaça os registros antes de removê-la.`,
        409,
      );
    }
  },

  async describe(tx, _session, step) {
    const batches = await tx.batch.findMany({
      where: { id: { in: step.suggestedBatchIds } },
      select: { id: true, name: true },
    });
    const byId = new Map(batches.map((b) => [b.id, b]));
    return {
      label: "Apartação",
      config: {
        suggestedBatches: step.suggestedBatchIds
          .map((id) => byId.get(id))
          .filter(Boolean),
      },
    };
  },

  async load(tx, session, _step, animalIds) {
    const animalFilter = animalIds ? { animalId: { in: animalIds } } : {};
    const [items, kept] = await Promise.all([
      tx.animalBatchTransferItem.findMany({
        where: { ...animalFilter, transfer: openTransfers(session.id) },
        include: {
          transfer: {
            select: { destinationBatch: { select: { id: true, name: true } } },
          },
        },
      }),
      tx.managementParticipant.findMany({
        where: {
          ...animalFilter,
          managementSessionId: session.id,
          batchKept: true,
        },
        select: { animalId: true },
      }),
    ]);

    type BatchRecord = {
      keep: boolean;
      batch: { id: string; name: string } | null;
      notes: string | null;
    };
    const records = new Map<string, BatchRecord>();
    for (const k of kept) {
      records.set(k.animalId, { keep: true, batch: null, notes: null });
    }
    for (const i of items) {
      records.set(i.animalId, {
        keep: false,
        batch: i.transfer.destinationBatch,
        notes: i.notes,
      });
    }
    return records;
  },

  payloadSchema: z.object({
    // null = permanecer no lote atual.
    batchId: z.uuid().nullable(),
    notes: stepNotesSchema,
  }),

  async save(tx, session, _step, animal, payload) {
    await removeAnimal(tx, session, animal.id);

    if (!payload.batchId || payload.batchId === animal.currentBatchId) {
      await tx.managementParticipant.updateMany({
        where: { managementSessionId: session.id, animalId: animal.id },
        data: { batchKept: true },
      });
      return;
    }

    const batch = await tx.batch.findFirst({
      where: {
        id: payload.batchId,
        propertyId: session.propertyId,
        closedAt: null,
      },
      select: { id: true },
    });
    if (!batch) {
      throw new StepError("Lote inválido ou encerrado.", 400, "batchId");
    }

    const transfer =
      (await tx.animalBatchTransfer.findFirst({
        where: { ...openTransfers(session.id), destinationBatchId: batch.id },
        select: { id: true },
      })) ??
      (await tx.animalBatchTransfer.create({
        data: {
          destinationBatchId: batch.id,
          propertyId: session.propertyId,
          managementSessionId: session.id,
          transferDate: session.managementDate,
          notes: "Apartação em sessão de manejo",
        },
        select: { id: true },
      }));

    await tx.animalBatchTransferItem.create({
      data: {
        transferId: transfer.id,
        animalId: animal.id,
        notes: payload.notes,
      },
    });
  },

  async clear(tx, session, _step, animalId) {
    await removeAnimal(tx, session, animalId);
  },

  async consolidate(tx, session) {
    const transfers = await tx.animalBatchTransfer.findMany({
      where: openTransfers(session.id),
      select: { id: true },
    });
    for (const t of transfers) {
      await tx.animalBatchTransfer.update({
        where: { id: t.id },
        data: { transferDate: session.managementDate },
      });
      await confirmTransferInTx(tx, t.id);
    }
  },
});
