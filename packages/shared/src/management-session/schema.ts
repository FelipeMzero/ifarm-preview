import { z } from "zod";
import { dateTimeField } from "../date";
import { FIELD_LIMITS } from "../field-limits";
import { planStepSchema } from "./plan-steps";

// Contratos da API de sessões de manejo. As etapas do planejamento estão em ./plan-steps.

/**
 * Campos da sessão (sem as etapas): o servidor os estende com as etapas do planejamento e
 * o formulário, com as etapas da tela.
 */
export const managementSessionFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.managementSession.title,
      `Máximo de ${FIELD_LIMITS.managementSession.title} caracteres`,
    ),
  // Data e hora previstas ("AAAA-MM-DDTHH:mm", no fuso da propriedade).
  scheduledAt: dateTimeField,
  notes: z
    .string()
    .max(
      FIELD_LIMITS.managementSession.notes,
      `Máximo de ${FIELD_LIMITS.managementSession.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
});

// Criação/alteração de uma sessão: os campos, as etapas do planejamento e os animais.
export const managementSessionSchema = managementSessionFieldsSchema.extend({
  // Pode ficar vazio só numa recepção de compra (receber os animais já é o trabalho).
  // Nas demais sessões o servidor exige ao menos um manejo ao criar e ao alterar (fatias
  // create-management-session e update-management-session da API), porque só ele sabe se a
  // sessão é recepção.
  steps: z.array(planStepSchema),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid("Propriedade inválida."),
});

export type ManagementSessionPayload = z.input<typeof managementSessionSchema>;
export type ManagementSessionData = z.output<typeof managementSessionSchema>;

export const sessionParticipantsSchema = z.object({
  animalIds: z.array(z.uuid()).min(1, "Selecione ao menos um animal."),
});

// Recepção de compra: o animal que desceu do caminhão.
export const receiveAnimalSchema = z.object({
  categoryId: z.number("Escolha a categoria do animal.").int(),
  // Sexo diferente do da categoria é permitido (com alerta na tela): quem decide é o
  // operador olhando o animal.
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  // Idade estimada (ex.: pela arcada dentária); vira data de nascimento estimada.
  ageMonths: z
    .number("Idade inválida")
    .int("Idade inválida")
    .min(0, "Idade inválida")
    .max(360, "Idade inválida")
    .nullish(),
  name: z
    .string()
    .trim()
    .max(
      FIELD_LIMITS.animal.name,
      `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
    )
    .nullish()
    .transform((v) => v || null),
});

export type ReceiveAnimalPayload = z.input<typeof receiveAnimalSchema>;
export type ReceiveAnimalData = z.output<typeof receiveAnimalSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const managementSessionQuerySchema = z.object({
  propertyId: z.uuid("Propriedade inválida."),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  // "open" = planejadas e em andamento.
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z
      .enum(["open", "planned", "in_progress", "confirmed", "cancelled"])
      .optional(),
  ),
});

export type ManagementSessionQuery = z.output<
  typeof managementSessionQuerySchema
>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type ManagementSessionListParams = Partial<ManagementSessionQuery>;

// Opções do planejamento e do registro (parâmetros da URL): as da propriedade da sessão.
export const managementOptionsQuerySchema = z.object({
  propertyId: z.uuid("Propriedade inválida."),
});
