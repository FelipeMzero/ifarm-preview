import {
  healthPayloadSchema,
  healthPlanSchema,
  REQUIRED_DOSE_MESSAGE,
} from "@ifarm/shared";
import { fromDbDate, toDbDate } from "../../../lib/db-dates";
import { doseChangeBlocker, plannedDose, requiresDose } from "../rules";
import { defineStep, StepError } from "./types";

// Datas do procedimento chegam como "AAAA-MM-DD" (ou null); no banco são @db.Date.
const toDbDay = (v: string | null) => (v ? toDbDate(v) : null);

export const healthStep = defineStep({
  type: "health",
  consolidateOrder: 50,

  planSchema: healthPlanSchema,

  async prepare(tx, session, plan) {
    const type = await tx.healthManagementType.findFirst({
      where: { id: plan.typeId, deactivatedAt: null },
      select: { id: true },
    });
    if (!type) throw new StepError("Tipo de procedimento inválido.");

    if (plan.veterinarianId) {
      const vet = await tx.person.findFirst({
        where: { id: plan.veterinarianId, deactivatedAt: null },
        select: { id: true },
      });
      if (!vet) throw new StepError("Veterinário inválido.");
    }

    const data = {
      typeId: plan.typeId,
      title: plan.title,
      veterinarianId: plan.veterinarianId,
      doseType: plan.doseType,
      ...plannedDose(plan),
      withdrawalEndDate: toDbDay(plan.withdrawalEndDate),
      nextDueDate: toDbDay(plan.nextDueDate),
    };

    if (plan.healthManagementId) {
      const current = await tx.healthManagement.findFirst({
        where: { id: plan.healthManagementId, managementSessionId: session.id },
        select: { doseType: true, _count: { select: { items: true } } },
      });
      const blocker =
        current &&
        doseChangeBlocker(
          { doseType: current.doseType, recordCount: current._count.items },
          plan.doseType,
        );
      if (blocker) throw new StepError(blocker, 409);

      const updated = await tx.healthManagement.updateMany({
        where: { id: plan.healthManagementId, managementSessionId: session.id },
        data,
      });
      if (updated.count === 1) {
        return {
          type: "health" as const,
          healthManagementId: plan.healthManagementId,
        };
      }
    }

    const created = await tx.healthManagement.create({
      data: { ...data, managementSessionId: session.id },
    });
    return { type: "health" as const, healthManagementId: created.id };
  },

  async dispose(tx, _session, step) {
    const count = await tx.healthManagementItem.count({
      where: { managementId: step.healthManagementId },
    });
    if (count) {
      throw new StepError(
        `O procedimento sanitário já foi registrado em ${count} animal(is). Desfaça os registros antes de removê-lo.`,
        409,
      );
    }
    await tx.healthManagement.deleteMany({
      where: { id: step.healthManagementId },
    });
  },

  async describe(tx, _session, step) {
    const hm = await tx.healthManagement.findUnique({
      where: { id: step.healthManagementId },
      include: {
        type: { select: { name: true } },
        veterinarian: { select: { name: true } },
      },
    });
    if (!hm) return { label: "Sanitário" };
    return {
      label: hm.title ? `${hm.type.name}: ${hm.title}` : hm.type.name,
      config: {
        healthManagementId: hm.id,
        typeId: hm.typeId,
        typeName: hm.type.name,
        title: hm.title,
        veterinarianId: hm.veterinarianId,
        veterinarianName: hm.veterinarian?.name ?? null,
        doseType: hm.doseType,
        doseMl: hm.doseMl?.toNumber() ?? null,
        doseWeightKg: hm.doseWeightKg?.toNumber() ?? null,
        withdrawalEndDate: fromDbDate(hm.withdrawalEndDate),
        nextDueDate: fromDbDate(hm.nextDueDate),
      },
    };
  },

  async load(tx, _session, step, animalIds) {
    const items = await tx.healthManagementItem.findMany({
      where: {
        managementId: step.healthManagementId,
        ...(animalIds ? { animalId: { in: animalIds } } : {}),
      },
    });
    return new Map(
      items.map((i) => [
        i.animalId,
        { doseMl: i.doseMl?.toNumber() ?? null, notes: i.notes },
      ]),
    );
  },

  // A dose é obrigatória quando o procedimento tem dose: validado em save, que conhece
  // o procedimento (a tela usa healthPayloadSchemaFor).
  payloadSchema: healthPayloadSchema,

  async save(tx, _session, step, animal, payload, at) {
    const hm = await tx.healthManagement.findUnique({
      where: { id: step.healthManagementId },
      select: { doseType: true },
    });
    if (!hm) throw new StepError("Procedimento sanitário não encontrado.");
    // Quem aplicou sabe a dose: não é estimada depois pelo peso.
    const withDose = requiresDose(hm.doseType);
    if (withDose && payload.doseMl == null) {
      throw new StepError(REQUIRED_DOSE_MESSAGE, 400, "doseMl");
    }
    const doseMl = withDose ? payload.doseMl : null;

    const existing = await tx.healthManagementItem.findFirst({
      where: { managementId: step.healthManagementId, animalId: animal.id },
    });
    if (existing) {
      await tx.healthManagementItem.update({
        where: { id: existing.id },
        data: { doseMl, notes: payload.notes, appliedAt: at },
      });
    } else {
      await tx.healthManagementItem.create({
        data: {
          managementId: step.healthManagementId,
          animalId: animal.id,
          doseMl,
          notes: payload.notes,
          appliedAt: at,
        },
      });
    }
  },

  async clear(tx, _session, step, animalId) {
    await tx.healthManagementItem.deleteMany({
      where: { managementId: step.healthManagementId, animalId },
    });
  },

  // Nada a gravar: cada aplicação já tem a sua hora e passa a valer com a sessão consolidada.
  async consolidate() {},
});
