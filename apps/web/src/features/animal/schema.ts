import { z } from "zod";
import {
  Sex as EnumSex,
  AnimalOrigin as EnumAnimalOrigin,
  AnimalStatus as EnumAnimalStatus,
} from "@/generated/prisma/enums";
import { FIELD_LIMITS } from "@/lib/field-limits";

export { EnumSex, EnumAnimalOrigin, EnumAnimalStatus };

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const animalFormSchema = z
  .object({
    currentTag: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.animal.earTag,
        `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`,
      ),
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
    neuteringMethod: z.string().optional(),
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
