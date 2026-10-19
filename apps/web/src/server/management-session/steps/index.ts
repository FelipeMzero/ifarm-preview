import "server-only";
import { z } from "zod";
import { stepKey, type SessionStep, type StepType } from "@ifarm/shared";
import { batchStep } from "@/server/management-session/steps/batch";
import { healthStep } from "@/server/management-session/steps/health";
import {
  rfidStep,
  tagStep,
} from "@/server/management-session/steps/identifier";
import { neuteringStep } from "@/server/management-session/steps/neutering";
import type {
  SessionCtx,
  StepModule,
  Tx,
} from "@/server/management-session/steps/types";
import { weighingStep } from "@/server/management-session/steps/weighing";

// Registro dos tipos de etapa. Um tipo novo entra aqui (e em packages/shared/src/management-session/steps.ts).
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

// Uma etapa enviada pelo planejamento: o tipo escolhe o schema do módulo.
export const planStepSchema = z
  .object({ type: z.enum(Object.keys(STEP_MODULES) as [StepType]) })
  .loose()
  .transform((value, ctx) => {
    const parsed = STEP_MODULES[value.type].planSchema.safeParse(value);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
        });
      }
      return z.NEVER;
    }
    return parsed.data as { type: StepType } & Record<string, unknown>;
  });

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
