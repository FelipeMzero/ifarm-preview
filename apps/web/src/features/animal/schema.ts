import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumSex = { MALE: "MALE", FEMALE: "FEMALE" } as const;
export const EnumAnimalOrigin = { BIRTH: "BIRTH", PURCHASE: "PURCHASE", TRANSFER: "TRANSFER" } as const;
export const EnumAnimalStatus = { ACTIVE: "ACTIVE", SOLD: "SOLD", DEAD: "DEAD", TRANSFERRED: "TRANSFERRED", DISCARDED: "DISCARDED", SLAUGHTERED: "SLAUGHTERED" } as const;

export const animalFormSchema = z.object({
  earTag:            z.string().min(1, "Este campo não pode ser vazio").max(FIELD_LIMITS.animal.earTag, `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`),
  rfid:              z.string().max(FIELD_LIMITS.animal.rfid, `Máximo de ${FIELD_LIMITS.animal.rfid} caracteres`).optional(),
  name:              z.string().max(FIELD_LIMITS.animal.name, `Máximo de ${FIELD_LIMITS.animal.name} caracteres`).optional(),
  sex:               z.enum(enumValues(EnumSex), "Este campo não pode ser vazio"),
  origin:            z.enum(enumValues(EnumAnimalOrigin), "Este campo não pode ser vazio"),
  status:            z.enum(enumValues(EnumAnimalStatus), "Este campo não pode ser vazio"),
  motherId:          z.string().optional(),
  fatherId:          z.string().optional(),
  originPropertyName: z.string().max(FIELD_LIMITS.animal.originPropertyName, `Máximo de ${FIELD_LIMITS.animal.originPropertyName} caracteres`).optional(),
  birthDate:         z.string().optional(),
  birthWeightKg:     z.string().optional(),
  breedId:           z.string().optional(),
  batchId:           z.string().optional(),
  originPropertyId:  z.string().optional(),
  acquisitionDate:   z.string().optional(),
  purchasePrice:     z.string().optional(),
  entryAgeMonths:    z.string().optional(),
  currentWeightKg:   z.string().optional(),
});


export type AnimalFormData = z.infer<typeof animalFormSchema>;
