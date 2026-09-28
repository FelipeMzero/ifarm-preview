import { z } from "zod";
import {
  Sex,
  AnimalOrigin,
  AnimalStatus,
  PersonType,
  MaritalStatus,
} from "@/generated/prisma/enums";
import { isValidTaxId } from "@/lib/tax-id";
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
    neuteringMethod: z
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
  neuteringMethod: z
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

export const personApiSchema = z
  .object({
    type: z.enum(PersonType),
    taxId: z.string().min(1, "Este campo não pode ser vazio"),
    name: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.person.name,
        `Máximo de ${FIELD_LIMITS.person.name} caracteres`,
      ),

    stateRegistration: z
      .string()
      .max(
        FIELD_LIMITS.person.stateRegistration,
        `Máximo de ${FIELD_LIMITS.person.stateRegistration} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    phone: z
      .string()
      .optional()
      .transform((v) => v || null),
    email: z
      .string()
      .max(
        FIELD_LIMITS.person.email,
        `Máximo de ${FIELD_LIMITS.person.email} caracteres`,
      )
      .optional()
      .transform((v) => v || null),

    // Exclusivo de Pessoa Jurídica
    tradeName: z
      .string()
      .max(
        FIELD_LIMITS.person.tradeName,
        `Máximo de ${FIELD_LIMITS.person.tradeName} caracteres`,
      )
      .optional()
      .transform((v) => v || null),

    // Exclusivos de Pessoa Física
    rg: z
      .string()
      .max(
        FIELD_LIMITS.person.rg,
        `Máximo de ${FIELD_LIMITS.person.rg} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    birthDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
    maritalStatus: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(MaritalStatus).optional(),
    ),

    // Endereço
    zipCode: z
      .string()
      .optional()
      .transform((v) => v || null),
    street: z
      .string()
      .max(
        FIELD_LIMITS.address.street,
        `Máximo de ${FIELD_LIMITS.address.street} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    number: z
      .string()
      .max(
        FIELD_LIMITS.address.number,
        `Máximo de ${FIELD_LIMITS.address.number} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    complement: z
      .string()
      .max(
        FIELD_LIMITS.address.complement,
        `Máximo de ${FIELD_LIMITS.address.complement} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    neighborhood: z
      .string()
      .max(
        FIELD_LIMITS.address.neighborhood,
        `Máximo de ${FIELD_LIMITS.address.neighborhood} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    city: z
      .string()
      .max(
        FIELD_LIMITS.address.city,
        `Máximo de ${FIELD_LIMITS.address.city} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    state: z
      .string()
      .optional()
      .transform((v) => v || null),
  })
  .check((ctx) => {
    const { type, taxId, zipCode, street, city, state } = ctx.value;

    if (taxId && !isValidTaxId(type, taxId)) {
      ctx.issues.push({
        code: "custom",
        input: taxId,
        path: ["taxId"],
        message:
          type === PersonType.INDIVIDUAL ? "CPF inválido" : "CNPJ inválido",
      });
    }

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode)
        ctx.issues.push({
          code: "custom",
          input: zipCode,
          path: ["zipCode"],
          message: "Este campo não pode ser vazio",
        });
      if (!street)
        ctx.issues.push({
          code: "custom",
          input: street,
          path: ["street"],
          message: "Este campo não pode ser vazio",
        });
      if (!city)
        ctx.issues.push({
          code: "custom",
          input: city,
          path: ["city"],
          message: "Este campo não pode ser vazio",
        });
      if (!state)
        ctx.issues.push({
          code: "custom",
          input: state,
          path: ["state"],
          message: "Este campo não pode ser vazio",
        });
    }
  });

export type PersonApiData = z.infer<typeof personApiSchema>;

export const personQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  type: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(PersonType).optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PersonQueryData = z.infer<typeof personQuerySchema>;

export const propertyApiSchema = z
  .object({
    name: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.property.name,
        `Máximo de ${FIELD_LIMITS.property.name} caracteres`,
      ),
    ownerId: z.string().min(1, "Este campo não pode ser vazio"),

    totalArea: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : null)),
    productiveArea: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : null)),
    cib: z
      .string()
      .max(
        FIELD_LIMITS.property.cib,
        `Máximo de ${FIELD_LIMITS.property.cib} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    ccir: z
      .string()
      .optional()
      .transform((v) => v || null),
    car: z
      .string()
      .optional()
      .transform((v) => v || null),
    latitude: z
      .preprocess(
        (v) => (v === "" ? undefined : v),
        z.coerce
          .number()
          .min(-90, "Latitude deve estar entre -90 e 90.")
          .max(90, "Latitude deve estar entre -90 e 90.")
          .optional(),
      )
      .transform((v) => v ?? null),
    longitude: z
      .preprocess(
        (v) => (v === "" ? undefined : v),
        z.coerce
          .number()
          .min(-180, "Longitude deve estar entre -180 e 180.")
          .max(180, "Longitude deve estar entre -180 e 180.")
          .optional(),
      )
      .transform((v) => v ?? null),

    // Endereço
    zipCode: z
      .string()
      .optional()
      .transform((v) => v || null),
    street: z
      .string()
      .max(
        FIELD_LIMITS.address.street,
        `Máximo de ${FIELD_LIMITS.address.street} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    number: z
      .string()
      .max(
        FIELD_LIMITS.address.number,
        `Máximo de ${FIELD_LIMITS.address.number} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    complement: z
      .string()
      .max(
        FIELD_LIMITS.address.complement,
        `Máximo de ${FIELD_LIMITS.address.complement} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    neighborhood: z
      .string()
      .max(
        FIELD_LIMITS.address.neighborhood,
        `Máximo de ${FIELD_LIMITS.address.neighborhood} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    city: z
      .string()
      .max(
        FIELD_LIMITS.address.city,
        `Máximo de ${FIELD_LIMITS.address.city} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    state: z
      .string()
      .optional()
      .transform((v) => v || null),
  })
  .check((ctx) => {
    const { totalArea, productiveArea, zipCode, street, city, state } =
      ctx.value;

    // RN-PROPRIEDADE-03: a área produtiva não pode ser maior que a área total.
    if (
      productiveArea != null &&
      totalArea != null &&
      productiveArea > totalArea
    ) {
      ctx.issues.push({
        code: "custom",
        input: productiveArea,
        path: ["productiveArea"],
        message: "A área produtiva não pode ser maior que a área total.",
      });
    }

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode)
        ctx.issues.push({
          code: "custom",
          input: zipCode,
          path: ["zipCode"],
          message: "Este campo não pode ser vazio",
        });
      if (!street)
        ctx.issues.push({
          code: "custom",
          input: street,
          path: ["street"],
          message: "Este campo não pode ser vazio",
        });
      if (!city)
        ctx.issues.push({
          code: "custom",
          input: city,
          path: ["city"],
          message: "Este campo não pode ser vazio",
        });
      if (!state)
        ctx.issues.push({
          code: "custom",
          input: state,
          path: ["state"],
          message: "Este campo não pode ser vazio",
        });
    }
  });

export type PropertyApiData = z.infer<typeof propertyApiSchema>;

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PropertyQueryData = z.infer<typeof propertyQuerySchema>;

export const breedApiSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.breed.name,
      `Máximo de ${FIELD_LIMITS.breed.name} caracteres`,
    ),
});

export type BreedApiData = z.infer<typeof breedApiSchema>;

export const healthManagementTypeApiSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.healthManagementType.name,
      `Máximo de ${FIELD_LIMITS.healthManagementType.name} caracteres`,
    ),
});

export type HealthManagementTypeApiData = z.infer<
  typeof healthManagementTypeApiSchema
>;

const areaDaysApiField = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.coerce
    .number()
    .int("Informe um número inteiro de dias.")
    .positive("Valor inválido.")
    .max(FIELD_LIMITS.area.days, `Máximo de ${FIELD_LIMITS.area.days} dias.`)
    .nullable(),
);

export const areaApiSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.area.name,
      `Máximo de ${FIELD_LIMITS.area.name} caracteres`,
    ),
  polygon: z.any(),
  hectares: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce
      .number()
      .positive("Hectares deve ser maior que 0")
      .max(
        FIELD_LIMITS.area.area,
        `Hectares não pode ultrapassar ${FIELD_LIMITS.area.area} ha`,
      ),
  ),
  stockingRate: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce
      .number()
      .positive("Taxa de lotação deve ser maior que 0")
      .max(
        FIELD_LIMITS.area.stockingRate,
        `Taxa de lotação não pode ultrapassar ${FIELD_LIMITS.area.stockingRate} UA/ha`,
      ),
  ),
  defaultOccupationDays: areaDaysApiField,
  defaultRestDays: areaDaysApiField,
  notes: z
    .string()
    .max(
      FIELD_LIMITS.area.notes,
      `Máximo de ${FIELD_LIMITS.area.notes} caracteres`,
    )
    .optional()
    .nullable()
    .transform((v) => v || null),
  propertyId: z.uuid("Propriedade inválida"),
});

export type AreaApiData = z.infer<typeof areaApiSchema>;

export const areaQuerySchema = z.object({
  propertyId: z.preprocess(
    (v) =>
      typeof v === "string" &&
      (v.trim() === "" || v === "undefined" || v === "null")
        ? undefined
        : v,
    z.uuid().optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional().default("active"),
  ),
  search: z.string().trim().optional().default(""),
  availableOnly: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().optional(),
  ),
});

export type AreaQueryData = z.infer<typeof areaQuerySchema>;

export const batchQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type BatchQueryData = z.infer<typeof batchQuerySchema>;

export const batchCreateApiSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  notes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
  areaId: z.uuid("Área inválida"),
  propertyId: z.uuid().optional(),
  hasMeta: z.boolean().optional().default(false),
  targetDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
  targetWeight: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null)),
});

export type BatchCreateApiData = z.infer<typeof batchCreateApiSchema>;

export const batchUpdateApiSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  notes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
  hasMeta: z.boolean().optional().default(false),
  targetDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
  targetWeight: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null)),
  newAreaId: z.uuid("Área inválida").optional(),
  areaChangeDescription: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
});

export type BatchUpdateApiData = z.infer<typeof batchUpdateApiSchema>;

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

export const batchTransferQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["pending", "confirmed", "cancelled"]).optional(),
  ),
});

export type BatchTransferQueryData = z.infer<typeof batchTransferQuerySchema>;

export const batchTransferApiSchema = z.object({
  destinationBatchId: z.uuid("Selecione o lote de destino."),
  transferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
    .transform((v) => new Date(`${v}T00:00:00`)),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batchTransfer.notes,
      `Máximo de ${FIELD_LIMITS.batchTransfer.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid().optional(),
});

export type BatchTransferApiData = z.infer<typeof batchTransferApiSchema>;

export const stockingPreviewApiSchema = z.object({
  areaId: z.uuid().optional(),
  batchId: z.uuid().optional(),
  transferId: z.uuid().optional(),
  animalIds: z.array(z.uuid()).optional().default([]),
  batchIds: z.array(z.uuid()).optional().default([]),
  newAnimals: z
    .array(
      z.object({
        weightKg: z.number().positive().nullable().optional(),
        birthDate: z
          .string()
          .optional()
          .transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
        sex: z.enum(Sex),
        neutered: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default([]),
});

export type StockingPreviewApiData = z.infer<typeof stockingPreviewApiSchema>;

export const batchReopenApiSchema = z.object({
  areaId: z.uuid("Selecione a área do lote."),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batch.notes,
      `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
});

export type BatchReopenApiData = z.infer<typeof batchReopenApiSchema>;

export const neuteringCorrectionApiSchema = z.object({
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  method: z
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
  method: z
    .string()
    .trim()
    .max(50, "Máximo de 50 caracteres")
    .optional()
    .transform((v) => v || null),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});
