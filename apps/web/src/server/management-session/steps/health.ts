import "server-only";
import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";
import { HealthManagementDoseType } from "@/generated/prisma/enums";
import {
  doseChangeBlocker,
  plannedDose,
  requiresDose,
} from "@/server/management-session/rules";
import {
  defineStep,
  StepError,
  stepNotesSchema,
} from "@/server/management-session/steps/types";
import { fromDbDate, toDbDate } from "@/server/db-dates";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? toDbDate(v) : null));

const toDateOnly = (d: Date | null) => (d ? fromDbDate(d) : null);

const positiveNumber = z.coerce
  .number("Informe um valor válido")
  .positive("Informe um valor maior que zero")
  .nullish();

export const healthStep = defineStep({
  type: "health",
  consolidateOrder: 50,

  planSchema: z
    .object({
      type: z.literal("health"),
      healthManagementId: z.uuid().optional(),
      typeId: z.uuid("Selecione o tipo do procedimento."),
      title: z
        .string()
        .trim()
        .max(
          FIELD_LIMITS.managementSession.healthTitle,
          `Máximo de ${FIELD_LIMITS.managementSession.healthTitle} caracteres`,
        )
        .nullish()
        .transform((v) => v || null),
      veterinarianId: z
        .uuid()
        .nullish()
        .or(z.literal(""))
        .transform((v) => v || null),
      doseType: z.enum(HealthManagementDoseType).default("NONE"),
      doseMl: positiveNumber,
      doseWeightKg: positiveNumber,
      withdrawalEndDate: optionalDate,
      nextDueDate: optionalDate,
    })
    .refine((v) => v.doseType === "NONE" || v.doseMl != null, {
      message: "Informe a dose.",
      path: ["doseMl"],
    })
    .refine((v) => v.doseType !== "PER_WEIGHT" || v.doseWeightKg != null, {
      message: "Informe o peso de referência.",
      path: ["doseWeightKg"],
    }),

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
      withdrawalEndDate: plan.withdrawalEndDate,
      nextDueDate: plan.nextDueDate,
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
      data: {
        ...data,
        managementSessionId: session.id,
        // Provisória: a data definitiva é a do manejo, gravada na consolidação.
        performedAt: session.performedAt ?? session.scheduledAt,
      },
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
        withdrawalEndDate: toDateOnly(hm.withdrawalEndDate),
        nextDueDate: toDateOnly(hm.nextDueDate),
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

  payloadSchema: z.object({
    // Obrigatória quando o procedimento tem dose (validado em save, que conhece a regra).
    doseMl: z
      .union([z.literal(""), z.null(), z.coerce.number()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v))
      .refine((v) => v == null || v > 0, "A dose deve ser maior que zero"),
    notes: stepNotesSchema,
  }),

  async save(tx, _session, step, animal, payload) {
    const hm = await tx.healthManagement.findUnique({
      where: { id: step.healthManagementId },
      select: { doseType: true },
    });
    if (!hm) throw new StepError("Procedimento sanitário não encontrado.");
    // Quem aplicou sabe a dose: não é estimada depois pelo peso.
    const withDose = requiresDose(hm.doseType);
    if (withDose && payload.doseMl == null) {
      throw new StepError("Informe a dose aplicada.", 400, "doseMl");
    }
    const doseMl = withDose ? payload.doseMl : null;

    const existing = await tx.healthManagementItem.findFirst({
      where: { managementId: step.healthManagementId, animalId: animal.id },
    });
    if (existing) {
      await tx.healthManagementItem.update({
        where: { id: existing.id },
        data: { doseMl, notes: payload.notes },
      });
    } else {
      await tx.healthManagementItem.create({
        data: {
          managementId: step.healthManagementId,
          animalId: animal.id,
          doseMl,
          notes: payload.notes,
        },
      });
    }
  },

  async clear(tx, _session, step, animalId) {
    await tx.healthManagementItem.deleteMany({
      where: { managementId: step.healthManagementId, animalId },
    });
  },

  async consolidate(tx, _session, step, effectiveAt) {
    await tx.healthManagement.update({
      where: { id: step.healthManagementId },
      data: { performedAt: effectiveAt },
    });
  },
});
