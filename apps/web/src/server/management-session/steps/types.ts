import "server-only";
import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";
import type { Prisma } from "@/server/db";
import type { StepType } from "@ifarm/shared";
import { BusinessError } from "@/server/errors";
import { type SessionStep } from "@/server/management-session/session-steps";

export type Tx = Prisma.TransactionClient;

export type SessionCtx = {
  id: string;
  propertyId: string;
  scheduledAt: Date;
  performedAt: Date | null;
};

export type StepAnimal = {
  id: string;
  code: number;
  sex: string;
  neutered: boolean;
  currentTag: string | null;
  currentRfid: string | null;
  currentBatchId: string | null;
};

// Dados para exibir a etapa nas telas (rótulo e configuração definida no planejamento).
export type StepView = { label: string; config?: Record<string, unknown> };

// Erro de regra de negócio, exibido ao usuário (no campo `field`, quando houver).
export class StepError extends BusinessError {}

/**
 * Contrato de um tipo de etapa. Cada tipo de manejo implementa este módulo e é
 * registrado em ./index.ts; o restante da sessão (planejamento, registro, consolidação)
 * só conversa com os módulos por aqui.
 *
 * Registros feitos durante a sessão são gravados nas tabelas definitivas, ligados à
 * sessão, mas só passam a valer na consolidação (ver ../effective.ts).
 */
export interface StepModule<
  S extends SessionStep = SessionStep,
  TPlan = unknown,
  TPayload = unknown,
  TRecord = unknown,
> {
  type: StepType;
  /** Configuração da etapa enviada pelo planejamento. */
  planSchema: z.ZodType<TPlan>;
  /** Cria/atualiza o que a etapa precisa na sessão e devolve o item gravado em `steps`. */
  prepare(tx: Tx, session: SessionCtx, plan: TPlan): Promise<S>;
  /** Remove a etapa da sessão; falha se já houver registros. */
  dispose(tx: Tx, session: SessionCtx, step: S): Promise<void>;
  describe(tx: Tx, session: SessionCtx, step: S): Promise<StepView>;
  /** Registros da etapa por animal. */
  load(
    tx: Tx,
    session: SessionCtx,
    step: S,
    animalIds?: string[],
  ): Promise<Map<string, TRecord>>;
  payloadSchema: z.ZodType<TPayload>;
  /** Grava (ou substitui) o registro da etapa para o animal. */
  save(
    tx: Tx,
    session: SessionCtx & { performedAt: Date },
    step: S,
    animal: StepAnimal,
    payload: TPayload,
  ): Promise<void>;
  clear(tx: Tx, session: SessionCtx, step: S, animalId: string): Promise<void>;
  /**
   * Efetiva os registros. `effectiveAt` é a data/hora que os registros passam a ter.
   * Roda depois de a sessão ser marcada como consolidada (os registros já contam
   * como efetivos), na ordem de `consolidateOrder`.
   */
  consolidate(
    tx: Tx,
    session: SessionCtx & { performedAt: Date },
    step: S,
    effectiveAt: Date,
  ): Promise<void>;
  consolidateOrder: number;
}

export function defineStep<S extends SessionStep, TPlan, TPayload, TRecord>(
  module: StepModule<S, TPlan, TPayload, TRecord>,
) {
  return module;
}
