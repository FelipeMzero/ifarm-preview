import { type StepType } from "@ifarm/shared";
import { repeatedStepMessage } from "./rules";
import { stepModule } from "./steps";
import { StepError, type SessionCtx, type Tx } from "./steps/types";
import {
  normalizeStepOrder,
  type SessionStep,
  toStepRows,
} from "./session-steps";

// Planejamento de uma sessão: aplica as etapas ao criar e alterar sessões e ao abrir uma
// recepção de compra.

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
