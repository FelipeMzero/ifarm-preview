import { z } from "zod";
import { dateField, dateTimeField } from "../date";
import { AnimalOrigin, Sex } from "../enums";
import { FIELD_LIMITS } from "../field-limits";

// Contratos da API de animais (os formulários têm estado próprio, em features/animal/schema.ts).
// Datas como "AAAA-MM-DD"; o servidor converte conforme a coluna (nascimento é @db.Date; as
// demais são timestamps que guardam o dia).

/** Data opcional; vazia vira null. */
const optionalDate = dateField.transform((v) => v || null);
/** Data e hora opcionais ("AAAA-MM-DDTHH:mm"); vazias viram null. */
const optionalDateTime = z
  .union([dateTimeField, z.literal("")])
  .optional()
  .transform((v) => v || null);
/**
 * Data e hora de um manejo avulso ou da correção de um registro ("AAAA-MM-DDTHH:mm"); vazia
 * vira undefined (registro avulso: agora; correção: não alterar).
 */
const eventDateTime = z
  .union([dateTimeField, z.literal("")])
  .optional()
  .transform((v) => v || undefined);

export const animalCreateSchema = z
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

    birthDate: optionalDate,
    // Entrada na fazenda: data e hora (vazia = agora).
    propertyEntryDate: optionalDateTime,

    batchId: z.string().min(1, "Este campo não pode ser vazio"),
    currentWeightKg: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : null)),

    neutered: z.boolean().optional().default(false),
    // Castração: data e hora (vazia = a da entrada).
    neuteringDate: optionalDateTime,
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

    acquisitionDate: optionalDate,

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

export type AnimalCreateData = z.infer<typeof animalCreateSchema>;

export const animalUpdateSchema = z.object({
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
  birthDate: optionalDate,
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

  neuteredAt: eventDateTime,
  neuteringTechniqueId: z
    .string()
    .optional()
    .transform((v) => v || null),
  neuteringNotes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export type AnimalUpdateData = z.infer<typeof animalUpdateSchema>;

export const weighingCorrectionSchema = z.object({
  weightKg: z.coerce
    .number("Informe um peso válido")
    .positive("O peso deve ser maior que zero"),
  date: eventDateTime,
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});
export type WeighingCorrectionData = z.infer<typeof weighingCorrectionSchema>;

export const neuteringCorrectionSchema = z.object({
  date: eventDateTime,
  techniqueId: z
    .string()
    .optional()
    .transform((v) => v || null),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});
export type NeuteringCorrectionData = z.infer<typeof neuteringCorrectionSchema>;

export const neuteringCancelSchema = z.object({
  // Usado só quando a castração excluída era a última registrada: o animal pode ter
  // sido castrado antes de chegar (sem registro), então quem decide é o usuário.
  keepNeutered: z.boolean().optional(),
});

// Registro avulso de pesagem feito pelo histórico de pesagens (gravado na hora).
export const weighingCreateSchema = z.object({
  weightKg: z.coerce
    .number("Informe um peso válido")
    .positive("O peso deve ser maior que zero"),
  date: eventDateTime,
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

// Registro avulso de castração feito pelo histórico de castrações (gravado na hora).
export const neuteringCreateSchema = z.object({
  date: z.string().min(1, "Informe a data").pipe(dateTimeField),
  // Castração feita na fazenda: a técnica é sempre conhecida.
  techniqueId: z.string("Informe a técnica.").min(1, "Informe a técnica."),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

// Troca (ou remoção) de brinco/RFID feita na hora.
export const identifierChangeSchema = z.object({
  // Vazio/null = remover o identificador do animal.
  value: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  notes: z
    .string()
    .nullish()
    .transform((v) => v || null),
});

export type IdentifierChangeData = z.output<typeof identifierChangeSchema>;

// Correção de um registro de brinco/RFID.
export const identifierCorrectionSchema = z.object({
  // Vazio = o registro passa a ser de remoção do identificador.
  value: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  date: eventDateTime,
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export type IdentifierCorrectionData = z.output<
  typeof identifierCorrectionSchema
>;

export type WeighingCreateData = z.output<typeof weighingCreateSchema>;
export type NeuteringCreateData = z.output<typeof neuteringCreateSchema>;
export type NeuteringCancelData = z.output<typeof neuteringCancelSchema>;

// O que o cliente envia (antes da validação).
export type AnimalCreatePayload = z.input<typeof animalCreateSchema>;
export type AnimalUpdatePayload = z.input<typeof animalUpdateSchema>;
export type WeighingCreatePayload = z.input<typeof weighingCreateSchema>;
export type WeighingCorrectionPayload = z.input<
  typeof weighingCorrectionSchema
>;
export type NeuteringCreatePayload = z.input<typeof neuteringCreateSchema>;
export type NeuteringCorrectionPayload = z.input<
  typeof neuteringCorrectionSchema
>;
export type IdentifierChangePayload = z.input<typeof identifierChangeSchema>;
export type IdentifierCorrectionPayload = z.input<
  typeof identifierCorrectionSchema
>;
