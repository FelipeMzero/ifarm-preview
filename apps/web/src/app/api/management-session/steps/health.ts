import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { HealthManagementPricingType } from "@/generated/prisma/enums";
import { defineStep, StepError, stepNotesSchema } from "./types";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null));

const toDateOnly = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

export const healthStep = defineStep({
  type: "health",
  // Depois da pesagem: o custo por kg usa o peso recém-consolidado.
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
      pricingType: z
        .enum(HealthManagementPricingType)
        .nullish()
        .or(z.literal(""))
        .transform((v) => v || null),
      unitPrice: z.coerce
        .number("Informe um valor válido")
        .min(0, "O valor não pode ser negativo")
        .nullish(),
      withdrawalUntil: optionalDate,
      nextDueDate: optionalDate,
    })
    .refine(
      (v) =>
        v.pricingType !== "FIXED" && v.pricingType !== "PER_WEIGHT"
          ? true
          : v.unitPrice != null && v.unitPrice > 0,
      { message: "Informe o valor.", path: ["unitPrice"] },
    ),

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
      pricingType: plan.pricingType,
      unitPrice: plan.pricingType === "FREE" ? null : (plan.unitPrice ?? null),
      withdrawalUntil: plan.withdrawalUntil,
      nextDueDate: plan.nextDueDate,
    };

    if (plan.healthManagementId) {
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
        performedAt: session.managementDate ?? session.scheduledDate,
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
        pricingType: hm.pricingType,
        unitPrice: hm.unitPrice?.toNumber() ?? null,
        withdrawalUntil: toDateOnly(hm.withdrawalUntil),
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
        { cost: i.cost?.toNumber() ?? null, notes: i.notes },
      ]),
    );
  },

  payloadSchema: z.object({
    // Vazio = calculado na consolidação pela forma de cobrança do procedimento.
    cost: z
      .union([z.literal(""), z.null(), z.coerce.number()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v))
      .refine((v) => v == null || v >= 0, "O custo não pode ser negativo"),
    notes: stepNotesSchema,
  }),

  async save(tx, _session, step, animal, payload) {
    const existing = await tx.healthManagementItem.findFirst({
      where: { managementId: step.healthManagementId, animalId: animal.id },
    });
    if (existing) {
      await tx.healthManagementItem.update({
        where: { id: existing.id },
        data: { cost: payload.cost, notes: payload.notes },
      });
    } else {
      await tx.healthManagementItem.create({
        data: {
          managementId: step.healthManagementId,
          animalId: animal.id,
          cost: payload.cost,
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
    const hm = await tx.healthManagement.update({
      where: { id: step.healthManagementId },
      data: { performedAt: effectiveAt },
    });

    // Custos não informados no registro seguem a forma de cobrança.
    const pending = await tx.healthManagementItem.findMany({
      where: { managementId: hm.id, cost: null },
      include: { animal: { select: { currentWeight: true } } },
    });
    const unitPrice = hm.unitPrice?.toNumber() ?? null;
    for (const item of pending) {
      const weight = item.animal.currentWeight?.toNumber() ?? null;
      const cost =
        hm.pricingType === "FREE"
          ? 0
          : hm.pricingType === "FIXED"
            ? unitPrice
            : hm.pricingType === "PER_WEIGHT" &&
                unitPrice != null &&
                weight != null
              ? Math.round(unitPrice * weight * 100) / 100
              : null;
      if (cost != null) {
        await tx.healthManagementItem.update({
          where: { id: item.id },
          data: { cost },
        });
      }
    }
  },
});
