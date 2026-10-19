// Tipos de etapa de uma sessão de manejo, compartilhados entre a API e as telas.
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

// Uma etapa da sessão (linha de ManagementStep, sem a posição).
export type SessionStep =
  | { type: "weighing" }
  | { type: "neutering" }
  | { type: "tag" }
  | { type: "rfid" }
  | { type: "health"; healthManagementId: string }
  | { type: "batch" };

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

// Chave estável da etapa dentro da sessão (o sanitário se distingue pelo procedimento).
export function stepKey(step: SessionStep) {
  return step.type === "health"
    ? `health:${step.healthManagementId}`
    : step.type;
}

// A apartação decide o destino do animal depois dos demais manejos: fica sempre por último.
export function normalizeStepOrder<T extends { type: StepType }>(steps: T[]) {
  return [
    ...steps.filter((s) => s.type !== "batch"),
    ...steps.filter((s) => s.type === "batch"),
  ];
}

// Etapas gravadas em ManagementStep, na ordem da sessão. O banco guarda o tipo em
// maiúsculas (enum ManagementStepType).
export const sessionStepsSelect = {
  orderBy: { position: "asc" },
  select: { type: true, healthManagementId: true },
} as const;

export function toSessionSteps(
  rows: { type: string; healthManagementId: string | null }[],
): SessionStep[] {
  return rows.map((row) => {
    const type = row.type.toLowerCase() as StepType;
    return type === "health"
      ? { type, healthManagementId: row.healthManagementId! }
      : { type };
  });
}

export function toStepRows(steps: SessionStep[]) {
  return steps.map((step, position) => ({
    type: step.type.toUpperCase() as Uppercase<StepType>,
    position,
    healthManagementId: step.type === "health" ? step.healthManagementId : null,
  }));
}

export type ManagementSessionStatus =
  "planned" | "in_progress" | "confirmed" | "cancelled";

export function sessionStatus(s: {
  managementDate: Date | string | null;
  confirmedAt: Date | string | null;
  cancelledAt: Date | string | null;
}): ManagementSessionStatus {
  if (s.cancelledAt) return "cancelled";
  if (s.confirmedAt) return "confirmed";
  if (s.managementDate) return "in_progress";
  return "planned";
}

// Situação de cada animal no registro: nenhuma, algumas ou todas as etapas registradas.
export type ParticipantStatus = "pending" | "partial" | "done";

export function participantStatus(
  done: number,
  total: number,
): ParticipantStatus {
  // Sem etapas (ex.: recepção de compra só para receber os animais): nada a registrar.
  if (total === 0) return "done";
  if (done === 0) return "pending";
  return done >= total ? "done" : "partial";
}
