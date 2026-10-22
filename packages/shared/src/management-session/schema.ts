import { z } from "zod";
import { dateTimeField, toLocalDateTime } from "../date";
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
  // Data e hora previstas ("AAAA-MM-DDTHH:mm", no fuso local).
  scheduledAt: dateTimeField.transform(toLocalDateTime),
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
  // Pode ficar vazio só numa recepção de compra (receber os animais já é o trabalho),
  // que é criada pela área de recepções; nas demais sessões a rota exige um manejo.
  steps: z.array(planStepSchema),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid().optional(),
});

export type ManagementSessionPayload = z.input<typeof managementSessionSchema>;
export type ManagementSessionData = z.output<typeof managementSessionSchema>;

export const managementSessionStartSchema = z.object({
  // Data e hora em que o manejo acontece ("AAAA-MM-DDTHH:mm", no fuso local).
  performedAt: dateTimeField.transform(toLocalDateTime),
});

export type ManagementSessionStartPayload = z.input<
  typeof managementSessionStartSchema
>;
export type ManagementSessionStartData = z.output<
  typeof managementSessionStartSchema
>;

export const sessionParticipantsSchema = z.object({
  animalIds: z.array(z.uuid()).min(1, "Selecione ao menos um animal."),
});

export type SessionParticipantsPayload = z.input<
  typeof sessionParticipantsSchema
>;

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
