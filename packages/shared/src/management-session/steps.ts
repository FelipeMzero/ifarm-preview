// Vocabulário das sessões de manejo usado pelas telas: tipos de etapa e situações.
// O modelo das etapas no servidor (chaves, ordem, gravação) está em
// server/management-session/session-steps.ts.
//
// Cada tipo é implementado como um módulo próprio (servidor em
// server/management-session/steps, tela em features/management-session/steps);
// para incluir um tipo novo, acrescente-o aqui e registre os dois módulos.

export const STEP_TYPES = [
  "weighing",
  "neutering",
  "tag",
  "rfid",
  "health",
  "batch",
] as const;

export type StepType = (typeof STEP_TYPES)[number];

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  weighing: "Pesagem",
  neutering: "Castração",
  tag: "Brinco",
  rfid: "RFID",
  health: "Sanitário",
  batch: "Apartação",
};

// Só o sanitário pode aparecer mais de uma vez na mesma sessão.
export const REPEATABLE_STEP_TYPES: readonly StepType[] = ["health"];

export type ManagementSessionStatus =
  "planned" | "in_progress" | "confirmed" | "cancelled";

// Em aberto: ainda não consolidada nem cancelada (planejada ou em andamento). É quando
// a sessão aceita alterações.
export const OPEN_SESSION_STATUSES: readonly ManagementSessionStatus[] = [
  "planned",
  "in_progress",
];

export const isSessionOpen = (status: ManagementSessionStatus) =>
  OPEN_SESSION_STATUSES.includes(status);

// Situação de cada animal no registro: nenhuma, algumas ou todas as etapas registradas.
export type ParticipantStatus = "pending" | "partial" | "done";
