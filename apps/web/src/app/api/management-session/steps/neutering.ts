import { z } from "zod";
import { defineStep, StepError, stepNotesSchema, type Tx } from "./types";

async function container(tx: Tx, sessionId: string) {
  return tx.neuteringManagement.findUnique({
    where: { managementSessionId: sessionId },
  });
}

export const neuteringStep = defineStep({
  type: "neutering",
  consolidateOrder: 20,

  planSchema: z.object({ type: z.literal("neutering") }),

  async prepare(tx, session) {
    await tx.neuteringManagement.upsert({
      where: { managementSessionId: session.id },
      create: { managementSessionId: session.id },
      update: {},
    });
    return { type: "neutering" as const };
  },

  async dispose(tx, session) {
    const management = await container(tx, session.id);
    if (!management) return;
    const count = await tx.animalNeutering.count({
      where: { managementId: management.id },
    });
    if (count) {
      throw new StepError(
        `A castração já foi registrada em ${count} animal(is). Desfaça os registros antes de removê-la.`,
        409,
      );
    }
    await tx.neuteringManagement.delete({ where: { id: management.id } });
  },

  async describe() {
    return { label: "Castração" };
  },

  async load(tx, session, _step, animalIds) {
    const items = await tx.animalNeutering.findMany({
      where: {
        management: { managementSessionId: session.id },
        ...(animalIds ? { animalId: { in: animalIds } } : {}),
      },
    });
    return new Map(
      items.map((i) => [i.animalId, { method: i.method, notes: i.notes }]),
    );
  },

  payloadSchema: z.object({
    method: z
      .string()
      .trim()
      .max(50, "Máximo de 50 caracteres")
      .nullish()
      .transform((v) => v || null),
    notes: stepNotesSchema,
  }),

  async save(tx, session, _step, animal, payload) {
    const management = await container(tx, session.id);
    if (!management) throw new StepError("Etapa de castração não encontrada.");

    const existing = await tx.animalNeutering.findFirst({
      where: { managementId: management.id, animalId: animal.id },
    });
    if (existing) {
      await tx.animalNeutering.update({
        where: { id: existing.id },
        data: { method: payload.method, notes: payload.notes },
      });
    } else {
      await tx.animalNeutering.create({
        data: {
          managementId: management.id,
          animalId: animal.id,
          method: payload.method,
          notes: payload.notes,
          neuteredAt: session.managementDate,
        },
      });
    }
  },

  async clear(tx, session, _step, animalId) {
    await tx.animalNeutering.deleteMany({
      where: { management: { managementSessionId: session.id }, animalId },
    });
  },

  async consolidate(tx, session, _step, effectiveAt) {
    const management = await container(tx, session.id);
    if (!management) return;

    await tx.animalNeutering.updateMany({
      where: { managementId: management.id },
      data: { neuteredAt: effectiveAt },
    });

    const items = await tx.animalNeutering.findMany({
      where: { managementId: management.id },
      select: { animalId: true },
    });
    if (items.length) {
      await tx.animal.updateMany({
        where: { id: { in: items.map((i) => i.animalId) } },
        data: { neutered: true },
      });
    }
  },
});
