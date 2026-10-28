import { neuteringPayloadSchema, neuteringPlanSchema } from "@ifarm/shared";
import {
  INVALID_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "../../animal/neutering/technique.public";
import { defineStep, StepError, type Tx } from "./types";

async function container(tx: Tx, sessionId: string) {
  return tx.neuteringManagement.findUnique({
    where: { managementSessionId: sessionId },
  });
}

export const neuteringStep = defineStep({
  type: "neutering",
  consolidateOrder: 20,

  planSchema: neuteringPlanSchema,

  async prepare(tx, session, plan) {
    const techniqueId = plan.suggestedTechniqueId ?? null;
    // Manter a técnica já planejada é permitido mesmo que tenha sido inativada depois.
    const current = await container(tx, session.id);
    if (
      !(await isValidNeuteringTechnique(
        techniqueId,
        current?.suggestedTechniqueId,
        tx,
      ))
    ) {
      throw new StepError(
        "A técnica prevista para a castração é inválida ou está inativa.",
      );
    }

    await tx.neuteringManagement.upsert({
      where: { managementSessionId: session.id },
      create: {
        managementSessionId: session.id,
        suggestedTechniqueId: techniqueId,
      },
      update: { suggestedTechniqueId: techniqueId },
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

  async describe(tx, session) {
    const technique = (
      await tx.neuteringManagement.findUnique({
        where: { managementSessionId: session.id },
        select: {
          suggestedTechnique: {
            select: { id: true, name: true, deactivatedAt: true },
          },
        },
      })
    )?.suggestedTechnique;
    return {
      label: "Castração",
      config: {
        suggestedTechnique: technique && {
          id: technique.id,
          name: technique.name,
          active: !technique.deactivatedAt,
        },
      },
    };
  },

  async load(tx, session, _step, animalIds) {
    const items = await tx.animalNeutering.findMany({
      where: {
        management: { managementSessionId: session.id },
        ...(animalIds ? { animalId: { in: animalIds } } : {}),
      },
      include: { technique: { select: { name: true } } },
    });
    return new Map(
      items.map((i) => [
        i.animalId,
        {
          techniqueId: i.techniqueId,
          techniqueName: i.technique?.name ?? null,
          notes: i.notes,
        },
      ]),
    );
  },

  payloadSchema: neuteringPayloadSchema,

  async save(tx, session, _step, animal, payload) {
    const management = await container(tx, session.id);
    if (!management) throw new StepError("Etapa de castração não encontrada.");

    const existing = await tx.animalNeutering.findFirst({
      where: { managementId: management.id, animalId: animal.id },
    });
    if (
      !(await isValidNeuteringTechnique(
        payload.techniqueId,
        existing?.techniqueId,
        tx,
      ))
    ) {
      throw new StepError(INVALID_TECHNIQUE_MESSAGE, 400, "techniqueId");
    }
    if (existing) {
      await tx.animalNeutering.update({
        where: { id: existing.id },
        data: { techniqueId: payload.techniqueId, notes: payload.notes },
      });
    } else {
      await tx.animalNeutering.create({
        data: {
          managementId: management.id,
          animalId: animal.id,
          techniqueId: payload.techniqueId,
          notes: payload.notes,
          neuteredAt: session.performedAt,
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
