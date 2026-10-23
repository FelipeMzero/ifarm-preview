import "server-only";
import {
  findStep,
  requireManagementDate,
  requireSessionIn,
  StepError,
  type LoadedSession,
} from "@/server/management-session/shared";
import {
  countDone,
  loadStepRecords,
  stepModule,
} from "@/server/management-session/steps";
import type { Tx } from "@/server/management-session/steps/types";

// Registro de uma etapa num animal da sessão (usado pela rota do registro e pelo seed).

async function requireParticipant(tx: Tx, sessionId: string, animalId: string) {
  const participant = await tx.managementParticipant.findUnique({
    where: {
      managementSessionId_animalId: {
        managementSessionId: sessionId,
        animalId,
      },
    },
  });
  if (!participant) {
    throw new StepError("O animal não participa desta sessão.", 404);
  }
  return participant;
}

// Mantém lastHandledAt coerente: sem registros, o animal volta para "a manejar".
async function touchParticipant(
  tx: Tx,
  session: LoadedSession,
  participantId: number,
  animalId: string,
) {
  const records = await loadStepRecords(tx, session, session.steps, [animalId]);
  await tx.managementParticipant.update({
    where: { id: participantId },
    data: { lastHandledAt: countDone(records, animalId) ? new Date() : null },
  });
}

/** Registra (ou corrige) uma etapa do manejo no animal. Lança Error se inválido. */
export async function saveAnimalStep(
  tx: Tx,
  sessionId: string,
  animalId: string,
  key: string,
  body: unknown,
) {
  const session = requireManagementDate(
    await requireSessionIn(
      tx,
      sessionId,
      ["in_progress"],
      "Somente sessões em andamento aceitam registros.",
    ),
  );
  const step = findStep(session.steps, key);
  const participant = await requireParticipant(tx, sessionId, animalId);

  const handler = stepModule(step.type);
  const validation = handler.payloadSchema.safeParse(body);
  if (!validation.success) throw validation.error;

  const animal = await tx.animal.findUniqueOrThrow({
    where: { id: animalId },
    select: {
      id: true,
      code: true,
      sex: true,
      neutered: true,
      currentTag: true,
      currentRfid: true,
      currentBatchId: true,
    },
  });

  await handler.save(tx, session, step, animal, validation.data);
  await touchParticipant(tx, session, participant.id, animalId);
}

/** Desfaz o registro da etapa no animal. */
export async function clearAnimalStep(
  tx: Tx,
  sessionId: string,
  animalId: string,
  key: string,
) {
  const session = await requireSessionIn(
    tx,
    sessionId,
    ["in_progress"],
    "Somente sessões em andamento podem ser alteradas.",
  );
  const step = findStep(session.steps, key);
  const participant = await requireParticipant(tx, sessionId, animalId);

  await stepModule(step.type).clear(tx, session, step, animalId);
  await touchParticipant(tx, session, participant.id, animalId);
}
