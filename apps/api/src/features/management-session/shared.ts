import { type ManagementSessionStatus } from "@ifarm/shared";
import type { CommitmentIntent } from "@ifarm/shared";
import {
  animalLabel,
  summarize,
  unavailableReason,
} from "../animal/availability.public";
import { StepError, type SessionCtx, type Tx } from "./steps/types";
import {
  sessionStatus,
  type SessionStep,
  sessionStepsSelect,
  stepKey,
  toSessionSteps,
} from "./session-steps.public";

export { StepError };

export type LoadedSession = SessionCtx & {
  status: ManagementSessionStatus;
  steps: SessionStep[];
};

export async function loadSession(
  tx: Tx,
  id: string,
): Promise<LoadedSession | null> {
  const session = await tx.managementSession.findUnique({
    where: { id },
    include: { steps: sessionStepsSelect },
  });
  if (!session) return null;
  return {
    id: session.id,
    propertyId: session.propertyId,
    scheduledAt: session.scheduledAt,
    performedAt: session.performedAt,
    status: sessionStatus(session),
    steps: toSessionSteps(session.steps),
  };
}

export async function requireSessionIn(
  tx: Tx,
  id: string,
  statuses: readonly ManagementSessionStatus[],
  message: string,
) {
  const session = await loadSession(tx, id);
  if (!session) throw new StepError("Sessão de manejo não encontrada.", 404);
  if (!statuses.includes(session.status)) throw new StepError(message, 409);
  return session;
}

export function requireManagementDate(session: LoadedSession) {
  if (!session.performedAt) {
    throw new StepError(
      "Informe a data do manejo para iniciar o registro.",
      409,
    );
  }
  return { ...session, performedAt: session.performedAt };
}

// Animais que não podem participar: fora da propriedade ou inativos.
export async function invalidAnimals(
  tx: Tx,
  propertyId: string,
  animalIds: string[],
) {
  if (!animalIds.length) return [];
  const animals = await tx.animal.findMany({
    where: { id: { in: animalIds } },
    select: {
      id: true,
      code: true,
      currentTag: true,
      currentRfid: true,
      status: true,
      currentPropertyId: true,
    },
  });
  const found = new Map(animals.map((a) => [a.id, a]));
  return animalIds
    .map((id) => found.get(id))
    .filter((a) => !a || unavailableReason(a, propertyId))
    .map((a) => (a ? animalLabel(a) : "desconhecido"));
}

export function invalidAnimalsMessage(labels: string[]) {
  return `Animais que não estão ativos na propriedade: ${summarize(labels)}.`;
}

export function findStep(steps: SessionStep[], key: string) {
  const step = steps.find((s) => stepKey(s) === key);
  if (!step) throw new StepError("Etapa não encontrada nesta sessão.", 404);
  return step;
}

// Intenção de participar desta sessão, para a checagem de compromissos dos animais
// (a recepção de compra é exclusiva; as demais conflitam pelas etapas).
export function sessionIntent(
  steps: SessionStep[],
  isReception: boolean,
): CommitmentIntent {
  return isReception
    ? { kind: "reception" }
    : { kind: "session", stepKeys: steps.map(stepKey) };
}
