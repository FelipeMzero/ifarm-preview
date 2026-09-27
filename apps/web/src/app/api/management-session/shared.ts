import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeStepOrder,
  parseSessionSteps,
  REPEATABLE_STEP_TYPES,
  sessionStatus,
  STEP_TYPE_LABELS,
  stepKey,
  type ManagementSessionStatus,
  type SessionStep,
  type StepType,
} from "@/lib/management-steps";
import type { CommitmentIntent } from "@/lib/animal-commitments";
import { CommitmentError } from "../animal/commitments";
import { ConfirmError } from "../batch-transfer/confirmTransfer";
import { ReceptionError } from "../purchase/reception";
import { animalLabel, summarize } from "../batch-transfer/shared";
import { stepModule } from "./steps";
import { StepError, type SessionCtx, type Tx } from "./steps/types";

export { StepError };

export type LoadedSession = SessionCtx & {
  status: ManagementSessionStatus;
  steps: SessionStep[];
};

export async function loadSession(
  tx: Tx,
  id: string,
): Promise<LoadedSession | null> {
  const session = await tx.managementSession.findUnique({ where: { id } });
  if (!session) return null;
  return {
    id: session.id,
    propertyId: session.propertyId,
    scheduledDate: session.scheduledDate,
    managementDate: session.managementDate,
    status: sessionStatus(session),
    steps: parseSessionSteps(session.steps),
  };
}

export async function requireSessionIn(
  tx: Tx,
  id: string,
  statuses: ManagementSessionStatus[],
  message: string,
) {
  const session = await loadSession(tx, id);
  if (!session) throw new StepError("Sessão de manejo não encontrada.", 404);
  if (!statuses.includes(session.status)) throw new StepError(message, 409);
  return session;
}

export function requireManagementDate(session: LoadedSession) {
  if (!session.managementDate) {
    throw new StepError(
      "Informe a data do manejo para iniciar o registro.",
      409,
    );
  }
  return { ...session, managementDate: session.managementDate };
}

// Data (sem horário) no fuso local, como nas demais datas de manejo.
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .transform((v) => new Date(`${v}T00:00:00`));

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const toDateOnly = (d: Date | null) =>
  d ? d.toLocaleDateString("en-CA") : null;

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
    .filter(
      (a) => !a || a.status !== "ACTIVE" || a.currentPropertyId !== propertyId,
    )
    .map((a) => (a ? animalLabel(a) : "desconhecido"));
}

export function invalidAnimalsMessage(labels: string[]) {
  return `Animais que não estão ativos na propriedade: ${summarize(labels)}.`;
}

// Aplica as etapas do planejamento: remove as que saíram (falha se já tiverem
// registros), cria/atualiza as demais e devolve a lista na ordem a gravar.
export async function applyPlanSteps(
  tx: Tx,
  session: SessionCtx,
  current: SessionStep[],
  plan: ({ type: StepType } & Record<string, unknown>)[],
) {
  const counts = new Map<StepType, number>();
  for (const p of plan) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
  for (const [type, count] of counts) {
    if (count > 1 && !REPEATABLE_STEP_TYPES.includes(type)) {
      throw new StepError(
        `O manejo "${STEP_TYPE_LABELS[type]}" só pode aparecer uma vez.`,
        400,
        "steps",
      );
    }
  }

  const keptHealth = new Set(
    plan
      .filter((p) => p.type === "health" && p.healthManagementId)
      .map((p) => p.healthManagementId as string),
  );
  for (const step of current) {
    const kept =
      step.type === "health"
        ? keptHealth.has(step.healthManagementId)
        : counts.has(step.type);
    if (!kept) await stepModule(step.type).dispose(tx, session, step);
  }

  const steps: SessionStep[] = [];
  for (const p of normalizeStepOrder(plan)) {
    steps.push(await stepModule(p.type).prepare(tx, session, p));
  }
  return steps;
}

export function findStep(steps: SessionStep[], key: string) {
  const step = steps.find((s) => stepKey(s) === key);
  if (!step) throw new StepError("Etapa não encontrada nesta sessão.", 404);
  return step;
}

export function errorResponse(error: unknown) {
  if (
    error instanceof StepError ||
    error instanceof ReceptionError ||
    error instanceof CommitmentError
  ) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        ...(error.field ? { errors: { [error.field]: error.message } } : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof ConfirmError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json(
    { success: false, message: "Ocorreu um erro interno no servidor." },
    { status: 500 },
  );
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

export function validationErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path.join(".");
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return NextResponse.json({ success: false, errors }, { status: 400 });
}
