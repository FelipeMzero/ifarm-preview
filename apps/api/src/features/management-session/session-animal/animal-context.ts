import { instantToZonedIso, isSessionOpen } from "@ifarm/shared";
import { fromDbDate } from "../../../lib/db-dates";
import { effectiveNeutering, effectiveWeighing } from "../effective.public";
import { participantStatus } from "../session-steps.public";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone.public";
import { loadSession } from "../shared";
import {
  countDone,
  describeSteps,
  loadStepRecords,
  NO_SESSION_VALUES,
  sessionValues,
} from "../steps";
import type { Tx } from "../steps/types";

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

  // As datas e horas, no fuso da propriedade da sessão (onde o animal está sendo manejado).
  const timeZone = await propertyTimeZone(session.propertyId, db);

  return {
    session: {
      id: session.id,
      status: session.status,
      performedAt: toZonedIso(session.performedAt, timeZone),
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
      birthDate: fromDbDate(animal.birthDate),
      neutered: animal.neutered,
      lastNeuteredAt: lastNeutering
        ? instantToZonedIso(lastNeutering.neuteredAt, timeZone)
        : null,
      currentWeightKg: animal.currentWeight?.toNumber() ?? null,
      lastWeighedAt: lastWeighing
        ? instantToZonedIso(lastWeighing.weighedAt, timeZone)
        : null,
      currentBatch: animal.currentBatch,
    },
    records: Object.fromEntries(
      steps.map((s) => [s.key, records.get(s.key)?.get(animalId) ?? null]),
    ),
    // Para o cabeçalho; as telas de etapa seguem usando os valores atuais de `animal`.
    sessionValues: isSessionOpen(session.status)
      ? sessionValues(records, animalId)
      : NO_SESSION_VALUES,
    status: participantStatus(countDone(records, animalId), steps.length),
  };
}
