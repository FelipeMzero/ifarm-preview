import "server-only";
import { fromLocalDateTime, participantStatus } from "@ifarm/shared";
import {
  effectiveNeutering,
  effectiveWeighing,
} from "@/server/management-session/effective";
import { loadSession } from "@/server/management-session/shared";
import {
  countDone,
  describeSteps,
  loadStepRecords,
  NO_SESSION_VALUES,
  sessionValues,
} from "@/server/management-session/steps";
import type { Tx } from "@/server/management-session/steps/types";

// Tudo o que as telas de etapa precisam de um animal da sessão: dados atuais do animal,
// etapas da sessão e o que já foi registrado nele. Null = o animal não está na sessão.
// Devolvido também por quem registra ou desfaz uma etapa, para a tela se atualizar sem
// outra requisição.
export async function loadAnimalContext(db: Tx, id: string, animalId: string) {
  const session = await loadSession(db, id);
  const participant = session
    ? await db.managementParticipant.findUnique({
        where: {
          managementSessionId_animalId: { managementSessionId: id, animalId },
        },
      })
    : null;
  if (!session || !participant) return null;

  const [animal, lastWeighing, lastNeutering, steps, records] =
    await Promise.all([
      db.animal.findUniqueOrThrow({
        where: { id: animalId },
        include: { currentBatch: { select: { id: true, name: true } } },
      }),
      db.animalWeighing.findFirst({
        where: { animalId, cancelledAt: null, ...effectiveWeighing },
        orderBy: [{ weighedAt: "desc" }, { id: "desc" }],
      }),
      db.animalNeutering.findFirst({
        where: { animalId, cancelledAt: null, ...effectiveNeutering },
        orderBy: [{ neuteredAt: "desc" }, { id: "desc" }],
      }),
      describeSteps(db, session, session.steps),
      loadStepRecords(db, session, session.steps, [animalId]),
    ]);

  return {
    session: {
      id: session.id,
      status: session.status,
      performedAt: session.performedAt
        ? fromLocalDateTime(session.performedAt)
        : null,
    },
    steps,
    animal: {
      id: animal.id,
      code: animal.code,
      earTag: animal.currentTag,
      rfid: animal.currentRfid,
      name: animal.name,
      sex: animal.sex,
      status: animal.status,
      birthDate: animal.birthDate?.toISOString().slice(0, 10) ?? null,
      neutered: animal.neutered,
      lastNeuteredAt: lastNeutering?.neuteredAt.toISOString() ?? null,
      currentWeightKg: animal.currentWeight?.toNumber() ?? null,
      lastWeighedAt: lastWeighing?.weighedAt.toISOString() ?? null,
      currentBatch: animal.currentBatch,
    },
    records: Object.fromEntries(
      steps.map((s) => [s.key, records.get(s.key)?.get(animalId) ?? null]),
    ),
    // Para o cabeçalho; as telas de etapa seguem usando os valores atuais de `animal`.
    sessionValues:
      session.status === "planned" || session.status === "in_progress"
        ? sessionValues(records, animalId)
        : NO_SESSION_VALUES,
    status: participantStatus(countDone(records, animalId), steps.length),
  };
}
