import { type ManagementSessionStatus, type StepType } from "@ifarm/shared";
import type { CommitmentIntent } from "@ifarm/shared";
import { animalLabel, summarize, unavailableReason } from "../animal/rules";
import { repeatedStepMessage } from "./rules";
import { stepModule } from "./steps";
import { StepError, type SessionCtx, type Tx } from "./steps/types";
import {
  normalizeStepOrder,
  sessionStatus,
  type SessionStep,
  sessionStepsSelect,
  stepKey,
  toSessionSteps,
  toStepRows,
} from "./session-steps";

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

// Aplica as etapas do planejamento: remove as que saíram (falha se já tiverem
// registros), cria/atualiza as demais e grava a lista em ManagementStep, na ordem.
export async function applyPlanSteps(
  tx: Tx,
  session: SessionCtx,
  current: SessionStep[],
  plan: ({ type: StepType } & Record<string, unknown>)[],
) {
  const repeated = repeatedStepMessage(plan);
  if (repeated) throw new StepError(repeated, 400, "steps");
  const plannedTypes = new Set(plan.map((p) => p.type));

  // A lista é regravada inteira no fim. Sai antes, para que o sanitário removido possa
  // apagar o seu procedimento (FK) e a reordenação não esbarre na posição única.
  await tx.managementStep.deleteMany({
    where: { managementSessionId: session.id },
  });

  const keptHealth = new Set(
    plan
      .filter((p) => p.type === "health" && p.healthManagementId)
      .map((p) => p.healthManagementId as string),
  );
  for (const step of current) {
    const kept =
      step.type === "health"
        ? keptHealth.has(step.healthManagementId)
        : plannedTypes.has(step.type);
    if (!kept) await stepModule(step.type).dispose(tx, session, step);
  }

  const steps: SessionStep[] = [];
  for (const p of normalizeStepOrder(plan)) {
    steps.push(await stepModule(p.type).prepare(tx, session, p));
  }
  await tx.managementStep.createMany({
    data: toStepRows(steps).map((row) => ({
      ...row,
      managementSessionId: session.id,
    })),
  });
  return steps;
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
