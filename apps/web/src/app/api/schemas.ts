import { z } from "zod";
import { Sex, AnimalOrigin, AnimalStatus } from "@/generated/prisma/enums";
import { FIELD_LIMITS } from "@/lib/field-limits";

export const animalCreateApiSchema = z
  .object({
    currentTag: z
      .string()
      .max(
        FIELD_LIMITS.animal.earTag,
        `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    currentRfid: z
      .string()
      .max(
        FIELD_LIMITS.animal.rfid,
        `Máximo de ${FIELD_LIMITS.animal.rfid} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    name: z
      .string()
      .max(
        FIELD_LIMITS.animal.name,
        `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    breedId: z
      .string()
      .optional()
      .transform((v) => v || null),

    sex: z.enum(Sex, "Este campo não pode ser vazio"),
    origin: z.enum(AnimalOrigin, "Este campo não pode ser vazio"),

    birthDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
    propertyEntryDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),

    batchId: z.string().min(1, "Este campo não pode ser vazio"),
    currentWeightKg: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : null)),

    neutered: z.boolean().optional().default(false),
    neuteringDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
    neuteringTechniqueId: z
      .string()
      .optional()
      .transform((v) => v || null),

    // Compra
    sellerId: z
      .string()
      .optional()
      .transform((v) => v || null),
    purchasePrice: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : null)),
    purchaseNotes: z
      .string()
      .max(
        FIELD_LIMITS.animal.purchaseNotes,
        `Máximo de ${FIELD_LIMITS.animal.purchaseNotes} caracteres`,
      )
      .optional()
      .transform((v) => v || null),

    acquisitionDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),

    propertyId: z
      .string()
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((data, ctx) => {
    if (data.origin === "PURCHASE") {
      if (!data.sellerId) {
        ctx.addIssue({
          code: "custom",
          path: ["sellerId"],
          message: "Este campo é obrigatório para compra.",
        });
      }
      if (!data.purchasePrice) {
        ctx.addIssue({
          code: "custom",
          path: ["purchasePrice"],
          message: "Este campo é obrigatório para compra.",
        });
      }
    }
  });

export type AnimalCreateApiData = z.infer<typeof animalCreateApiSchema>;

export const animalUpdateApiSchema = z.object({
  name: z
    .string()
    .max(
      FIELD_LIMITS.animal.name,
      `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
  breedId: z
    .string()
    .optional()
    .transform((v) => v || null),
  birthDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
  sex: z.enum(Sex, "Este campo não pode ser vazio"),

  newTag: z
    .string()
    .max(
      FIELD_LIMITS.animal.earTag,
      `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`,
    )
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  tagChangeNotes: z
    .string()
    .optional()
    .transform((v) => v || null),

  newRfid: z
    .string()
    .max(
      FIELD_LIMITS.animal.rfid,
      `Máximo de ${FIELD_LIMITS.animal.rfid} caracteres`,
    )
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  rfidChangeNotes: z
    .string()
    .optional()
    .transform((v) => v || null),

  newBatchId: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  batchChangeNotes: z
    .string()
    .optional()
    .transform((v) => v || null),

  newWeightKg: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  weightChangeNotes: z
    .string()
    .optional()
    .transform((v) => v || null),

  neuteredAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  neuteringTechniqueId: z
    .string()
    .optional()
    .transform((v) => v || null),
  neuteringNotes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export type AnimalUpdateApiData = z.infer<typeof animalUpdateApiSchema>;

export const animalQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(AnimalStatus).optional(),
  ),
  sex: z.preprocess((v) => (v === "" ? undefined : v), z.enum(Sex).optional()),
  // "none" = animais sem lote.
  batchId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.union([z.uuid(), z.literal("none")]).optional(),
  ),
  neutered: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["true", "false"]).optional(),
  ),
  // Faixa etária pela data de nascimento; "unknown" = sem data de nascimento.
  ageRange: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["upTo12", "12to24", "over24", "unknown"]).optional(),
  ),
  breedId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  origin: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(AnimalOrigin).optional(),
  ),
  excludeBatchId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.uuid().optional(),
  ),
  minWeight: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  maxWeight: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
});

export type AnimalQueryData = z.infer<typeof animalQuerySchema>;

export const weighingCorrectionApiSchema = z.object({
  weightKg: z.coerce
    .number("Informe um peso válido")
    .positive("O peso deve ser maior que zero"),
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});
export type WeighingCorrectionApiData = z.infer<
  typeof weighingCorrectionApiSchema
>;

export const neuteringCorrectionApiSchema = z.object({
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  techniqueId: z
    .string()
    .optional()
    .transform((v) => v || null),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});
export type NeuteringCorrectionApiData = z.infer<
  typeof neuteringCorrectionApiSchema
>;

export const neuteringCancelApiSchema = z.object({
  // Usado só quando a castração excluída era a última registrada: o animal pode ter
  // sido castrado antes de chegar (sem registro), então quem decide é o usuário.
  keepNeutered: z.boolean().optional(),
});

// Registro avulso de pesagem feito pelo histórico de pesagens (gravado na hora).
export const weighingCreateApiSchema = z.object({
  weightKg: z.coerce
    .number("Informe um peso válido")
    .positive("O peso deve ser maior que zero"),
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

// Registro avulso de castração feito pelo histórico de castrações (gravado na hora).
export const neuteringCreateApiSchema = z.object({
  date: z
    .string()
    .min(1, "Informe a data")
    .transform((v) => new Date(`${v}T00:00:00`)),
  // Castração feita na fazenda: a técnica é sempre conhecida.
  techniqueId: z.string("Informe a técnica.").min(1, "Informe a técnica."),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});
