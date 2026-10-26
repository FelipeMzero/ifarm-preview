import { type StepType } from "@ifarm/shared";
import { batchStep } from "./batch";
import { healthStep } from "./health";
import { rfidStep, tagStep } from "./identifier";
import { neuteringStep } from "./neutering";
import type { SessionCtx, StepModule, Tx } from "./types";
import { weighingStep } from "./weighing";
import { type SessionStep, stepKey } from "../session-steps";

// Registro dos tipos de etapa. Um tipo novo entra aqui e em packages/shared/src/management-session
// (steps.ts, plan-steps.ts e step-payloads.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STEP_MODULES: Record<StepType, StepModule<any, any, any, any>> = {
  weighing: weighingStep,
  neutering: neuteringStep,
  tag: tagStep,
  rfid: rfidStep,
  health: healthStep,
  batch: batchStep,
};

export function stepModule(type: StepType) {
  return STEP_MODULES[type];
}

export async function describeSteps(
  tx: Tx,
  session: SessionCtx,
  steps: SessionStep[],
) {
  return Promise.all(
    steps.map(async (step) => ({
      key: stepKey(step),
      type: step.type,
      ...(await STEP_MODULES[step.type].describe(tx, session, step)),
    })),
  );
}

// Registros de cada etapa (pela chave da etapa), por animal.
export async function loadStepRecords(
  tx: Tx,
  session: SessionCtx,
  steps: SessionStep[],
  animalIds?: string[],
) {
  const entries = await Promise.all(
    steps.map(
      async (step) =>
        [
          stepKey(step),
          (await STEP_MODULES[step.type].load(
            tx,
            session,
            step,
            animalIds,
          )) as Map<string, unknown>,
        ] as const,
    ),
  );
  return new Map(entries);
}

// Brinco, RFID e peso registrados no animal nesta sessão, ainda sem valer fora dela
// (só passam a ser os atuais na consolidação). As telas da sessão os exibem no lugar
// dos atuais, para mostrar o que está no animal agora.
export function sessionValues(
  records: Map<string, Map<string, unknown>>,
  animalId: string,
) {
  const record = <T>(key: StepType) =>
    records.get(key)?.get(animalId) as T | undefined;
  return {
    earTag: record<{ value: string }>("tag")?.value ?? null,
    rfid: record<{ value: string }>("rfid")?.value ?? null,
    weightKg: record<{ weightKg: number }>("weighing")?.weightKg ?? null,
  };
}

export type SessionValues = ReturnType<typeof sessionValues>;

export const NO_SESSION_VALUES: SessionValues = {
  earTag: null,
  rfid: null,
  weightKg: null,
};

export function countDone(
  records: Map<string, Map<string, unknown>>,
  animalId: string,
) {
  let done = 0;
  for (const byAnimal of records.values()) if (byAnimal.has(animalId)) done++;
  return done;
}
