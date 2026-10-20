import type {
  ManagementSessionStatus,
  ParticipantStatus,
  StepType,
} from "@ifarm/shared";

// Modelo das etapas da sessão no servidor: identidade, ordem, gravação em
// ManagementStep e as situações calculadas (a API as devolve prontas para as telas).

// Uma etapa da sessão (linha de ManagementStep, sem a posição).
export type SessionStep =
  | { type: "weighing" }
  | { type: "neutering" }
  | { type: "tag" }
  | { type: "rfid" }
  | { type: "health"; healthManagementId: string }
  | { type: "batch" };

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

export function sessionStatus(s: {
  performedAt: Date | string | null;
  confirmedAt: Date | string | null;
  cancelledAt: Date | string | null;
}): ManagementSessionStatus {
  if (s.cancelledAt) return "cancelled";
  if (s.confirmedAt) return "confirmed";
  if (s.performedAt) return "in_progress";
  return "planned";
}

export function participantStatus(
  done: number,
  total: number,
): ParticipantStatus {
  // Sem etapas (ex.: recepção de compra só para receber os animais): nada a registrar.
  if (total === 0) return "done";
  if (done === 0) return "pending";
  return done >= total ? "done" : "partial";
}
