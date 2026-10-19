import { z } from "zod";
import {
  FIELD_LIMITS,
  Sex as EnumSex,
  AnimalOrigin as EnumAnimalOrigin,
  AnimalStatus as EnumAnimalStatus,
} from "@ifarm/shared";

export { EnumSex, EnumAnimalOrigin, EnumAnimalStatus };

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const animalFormSchema = z
  .object({
    currentTag: z
      .string()
      .max(
        FIELD_LIMITS.animal.earTag,
        `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`,
      )
      .optional(),
    currentRfid: z
      .string()
      .max(
        FIELD_LIMITS.animal.rfid,
        `Máximo de ${FIELD_LIMITS.animal.rfid} caracteres`,
      )
      .optional(),
    name: z
      .string()
      .max(
        FIELD_LIMITS.animal.name,
        `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
      )
      .optional(),
    sex: z.enum(enumValues(EnumSex), "Este campo não pode ser vazio"),
    origin: z.enum(
      enumValues(EnumAnimalOrigin),
      "Este campo não pode ser vazio",
    ),
    birthDate: z.string().optional(),
    propertyEntryDate: z.string().optional(),
    breedId: z.string().optional(),
    batchId: z.string().min(1, "Este campo não pode ser vazio"),
    currentWeightKg: z.string().optional(),
    neutered: z.boolean(),
    neuteringDate: z.string().optional(),
    neuteringTechniqueId: z.string().optional(),
    // Compra
    sellerId: z.string().optional(),
    purchasePrice: z.string().optional(),
    purchaseNotes: z
      .string()
      .max(
        FIELD_LIMITS.animal.purchaseNotes,
        `Máximo de ${FIELD_LIMITS.animal.purchaseNotes} caracteres`,
      )
      .optional(),
    acquisitionDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.origin === EnumAnimalOrigin.PURCHASE) {
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

export type AnimalFormData = z.infer<typeof animalFormSchema>;

export const animalEditFormSchema = z.object({
  name: z
    .string()
    .max(
      FIELD_LIMITS.animal.name,
      `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
    )
    .optional(),
  sex: z.enum(enumValues(EnumSex), "Este campo não pode ser vazio"),
  birthDate: z.string().optional(),
  breedId: z.string().optional(),
});

export type AnimalEditFormData = z.infer<typeof animalEditFormSchema>;

export const animalBatchChangeSchema = z.object({
  newBatchId: z.string().min(1, "Este campo não pode ser vazio"),
  notes: z.string().optional(),
});

export type AnimalBatchChangeData = z.infer<typeof animalBatchChangeSchema>;

export const weighingCorrectionSchema = z.object({
  weightKg: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .refine((v) => Number(v) > 0, "O peso deve ser maior que zero"),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export type WeighingCorrectionFormData = z.infer<
  typeof weighingCorrectionSchema
>;

export const neuteringCorrectionSchema = z.object({
  date: z.string().optional(),
  techniqueId: z.string().optional(),
  notes: z.string().optional(),
});

export type NeuteringCorrectionFormData = z.infer<
  typeof neuteringCorrectionSchema
>;
