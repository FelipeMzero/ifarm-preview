import { weighingPayloadSchema, weighingPlanSchema } from "@ifarm/shared";
import { recomputeCurrentWeight } from "../../animal/weighing/current-weight.public";
import { defineStep, StepError, type Tx } from "./types";

async function container(tx: Tx, sessionId: string) {
  return tx.weighingManagement.findUnique({
    where: { managementSessionId: sessionId },
  });
}

export const weighingStep = defineStep({
  type: "weighing",
  consolidateOrder: 10,

  planSchema: weighingPlanSchema,

  async prepare(tx, session) {
    await tx.weighingManagement.upsert({
      where: { managementSessionId: session.id },
      create: { managementSessionId: session.id },
      update: {},
    });
    return { type: "weighing" as const };
  },

  async dispose(tx, session) {
    const management = await container(tx, session.id);
    if (!management) return;
    const count = await tx.animalWeighing.count({
      where: { managementId: management.id },
    });
    if (count) {
      throw new StepError(
        `A pesagem já foi registrada em ${count} animal(is). Desfaça os registros antes de removê-la.`,
        409,
      );
    }
    await tx.weighingManagement.delete({ where: { id: management.id } });
  },

  async describe() {
    return { label: "Pesagem" };
  },

  async load(tx, session, _step, animalIds) {
    const items = await tx.animalWeighing.findMany({
      where: {
        management: { managementSessionId: session.id },
        ...(animalIds ? { animalId: { in: animalIds } } : {}),
      },
    });
    return new Map(
      items.map((i) => [
        i.animalId,
        { weightKg: i.weight.toNumber(), notes: i.notes },
      ]),
    );
  },

  payloadSchema: weighingPayloadSchema,

  async save(tx, session, _step, animal, payload, at) {
    const management = await container(tx, session.id);
    if (!management) throw new StepError("Etapa de pesagem não encontrada.");

    const existing = await tx.animalWeighing.findFirst({
      where: { managementId: management.id, animalId: animal.id },
    });
    if (existing) {
      await tx.animalWeighing.update({
        where: { id: existing.id },
        data: {
          weight: payload.weightKg,
          notes: payload.notes,
          weighedAt: at,
        },
      });
    } else {
      await tx.animalWeighing.create({
        data: {
          managementId: management.id,
          animalId: animal.id,
          weight: payload.weightKg,
          notes: payload.notes,
          weighedAt: at,
        },
      });
    }
  },

  async clear(tx, session, _step, animalId) {
    await tx.animalWeighing.deleteMany({
      where: { management: { managementSessionId: session.id }, animalId },
    });
  },

  async consolidate(tx, session) {
    const management = await container(tx, session.id);
    if (!management) return;

    const items = await tx.animalWeighing.findMany({
      where: { managementId: management.id },
      select: { animalId: true },
    });
    for (const { animalId } of items) {
      await recomputeCurrentWeight(tx, animalId);
    }
  },
});
