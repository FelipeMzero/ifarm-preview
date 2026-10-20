import "server-only";
import { z } from "zod";
import { recomputeCurrentWeight } from "@/server/animal/weighings";
import {
  defineStep,
  StepError,
  stepNotesSchema,
  type Tx,
} from "@/server/management-session/steps/types";

async function container(tx: Tx, sessionId: string) {
  return tx.weighingManagement.findUnique({
    where: { managementSessionId: sessionId },
  });
}

export const weighingStep = defineStep({
  type: "weighing",
  consolidateOrder: 10,

  planSchema: z.object({ type: z.literal("weighing") }),

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

  payloadSchema: z.object({
    weightKg: z.coerce
      .number("Informe um peso válido")
      .positive("O peso deve ser maior que zero")
      .max(3000, "Peso acima do limite (3000 kg)"),
    notes: stepNotesSchema,
  }),

  async save(tx, session, _step, animal, payload) {
    const management = await container(tx, session.id);
    if (!management) throw new StepError("Etapa de pesagem não encontrada.");

    const existing = await tx.animalWeighing.findFirst({
      where: { managementId: management.id, animalId: animal.id },
    });
    if (existing) {
      await tx.animalWeighing.update({
        where: { id: existing.id },
        data: { weight: payload.weightKg, notes: payload.notes },
      });
    } else {
      await tx.animalWeighing.create({
        data: {
          managementId: management.id,
          animalId: animal.id,
          weight: payload.weightKg,
          notes: payload.notes,
          weighedAt: session.performedAt,
        },
      });
    }
  },

  async clear(tx, session, _step, animalId) {
    await tx.animalWeighing.deleteMany({
      where: { management: { managementSessionId: session.id }, animalId },
    });
  },

  async consolidate(tx, session, _step, effectiveAt) {
    const management = await container(tx, session.id);
    if (!management) return;

    await tx.animalWeighing.updateMany({
      where: { managementId: management.id },
      data: { weighedAt: effectiveAt },
    });

    const items = await tx.animalWeighing.findMany({
      where: { managementId: management.id },
      select: { animalId: true },
    });
    for (const { animalId } of items) {
      await recomputeCurrentWeight(tx, animalId);
    }
  },
});
