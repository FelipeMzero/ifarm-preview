import {
  OPEN_SESSION_STATUSES,
  type ManagementSessionData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { diffIds } from "@ifarm/domain/diff";
import { assertNoConflicts } from "../../animal/commitments";
import { animalLabel, summarize } from "../../animal/rules";
import { findReception } from "../../purchase/reception";
import { stepKey } from "../session-steps";
import {
  applyPlanSteps,
  invalidAnimals,
  invalidAnimalsMessage,
  requireSessionIn,
  sessionIntent,
  StepError,
  type LoadedSession,
} from "../shared";
import { countDone, loadStepRecords } from "../steps";
import type { Tx } from "../steps/types";

// Altera o planejamento (data prevista, observação, etapas e participantes). Vale
// enquanto a sessão não for consolidada ou cancelada, inclusive durante o registro.
export async function updateManagementSession(
  id: string,
  data: ManagementSessionData,
) {
  const animalIds = [...new Set(data.animalIds)];

  await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "Somente sessões não consolidadas podem ser alteradas.",
    );
    const reception = await findReception(tx, id);
    if (!reception && !data.steps.length) {
      throw new StepError("Adicione ao menos um manejo.", 400, "steps");
    }

    // Na recepção os participantes são os animais recebidos (não vêm do planejamento).
    const participants = reception
      ? null
      : await updateParticipants(tx, session, animalIds);

    const steps = await applyPlanSteps(tx, session, session.steps, data.steps);

    if (participants) {
      await assertNoConflicts(
        tx,
        participants.added,
        sessionIntent(steps, false),
        { sessionId: id },
      );
      // Quem já participava só é checado nas etapas acrescentadas ao planejamento.
      const previous = new Set(session.steps.map(stepKey));
      const newKeys = steps.map(stepKey).filter((key) => !previous.has(key));
      if (newKeys.length) {
        await assertNoConflicts(
          tx,
          participants.kept,
          { kind: "session", stepKeys: newKeys },
          { sessionId: id },
        );
      }
    }

    await tx.managementSession.update({
      where: { id },
      data: {
        title: data.title,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
      },
    });
  });
}

async function updateParticipants(
  tx: Tx,
  session: LoadedSession,
  animalIds: string[],
) {
  const id = session.id;
  const current = await tx.managementParticipant.findMany({
    where: { managementSessionId: id },
    include: {
      animal: {
        select: { code: true, currentTag: true, currentRfid: true },
      },
    },
  });
  const { removed, added, kept } = diffIds(
    current,
    animalIds,
    (p) => p.animalId,
  );

  const invalid = await invalidAnimals(tx, session.propertyId, added);
  if (invalid.length) {
    throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
  }

  // Quem já tem registro só sai pela tela de registro (que desfaz os registros).
  if (removed.length) {
    const records = await loadStepRecords(
      tx,
      session,
      session.steps,
      removed.map((p) => p.animalId),
    );
    const handled = removed.filter((p) => countDone(records, p.animalId));
    if (handled.length) {
      throw new StepError(
        `Animais com manejo já registrado não podem sair pelo planejamento: ${summarize(
          handled.map((p) => animalLabel(p.animal)),
        )}. Remova-os pela tela de registro.`,
        409,
        "animalIds",
      );
    }
    await tx.managementParticipant.deleteMany({
      where: { id: { in: removed.map((p) => p.id) } },
    });
  }

  if (added.length) {
    await tx.managementParticipant.createMany({
      data: added.map((animalId) => ({
        managementSessionId: id,
        animalId,
      })),
    });
  }

  return { added, kept };
}
