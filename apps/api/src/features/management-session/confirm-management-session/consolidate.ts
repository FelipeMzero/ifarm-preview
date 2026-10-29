import { assertNoConflicts } from "../../animal/commitments.public";
import {
  animalLabel,
  summarize,
  unavailableAnimalsMessage,
  unavailableReason,
} from "../../animal/availability.public";
import { findReception } from "../../purchase/reception.public";
import { splitHandled } from "../rules";
import {
  requireManagementDate,
  requireSessionIn,
  sessionIntent,
  StepError,
} from "../shared";
import { countDone, loadStepRecords, stepModule } from "../steps";
import type { Tx } from "../steps/types";

/**
 * Consolida a sessão: os animais sem nenhum registro saem da sessão e os registros
 * feitos passam a valer (peso atual, identificação, castração, sanitário e lote).
 * Etapas puladas num animal simplesmente não têm efeito sobre ele. `at` é o instante da
 * consolidação (padrão: agora).
 */
export async function consolidateSession(tx: Tx, id: string, at?: Date) {
  const session = requireManagementDate(
    await requireSessionIn(
      tx,
      id,
      ["in_progress"],
      "Somente sessões em andamento podem ser consolidadas.",
    ),
  );

  const participants = await tx.managementParticipant.findMany({
    where: { managementSessionId: id },
    include: {
      animal: {
        select: {
          code: true,
          currentTag: true,
          currentRfid: true,
          status: true,
          currentPropertyId: true,
        },
      },
    },
  });
  const records = await loadStepRecords(tx, session, session.steps);
  // Na recepção de compra todo participante é um animal recebido (já existe):
  // conta como manejado mesmo sem etapas registradas e não sai da sessão.
  const reception = await findReception(tx, id);
  const { handled, notHandled } = splitHandled(
    participants,
    (p) => countDone(records, p.animalId) > 0,
    !!reception,
  );

  if (!handled.length) {
    throw new StepError(
      reception
        ? "Nenhum animal foi recebido. Receba ao menos um animal antes de consolidar."
        : "Nenhum animal foi manejado. Registre ao menos um animal antes de consolidar.",
    );
  }

  // Vale para todos os animais da sessão, manejados ou não: quem deixou de poder
  // participar precisa ser removido antes (Operações com animais selecionados).
  const inactive = participants.filter(({ animal }) =>
    unavailableReason(animal, session.propertyId),
  );
  if (inactive.length) {
    throw new StepError(
      unavailableAnimalsMessage(
        summarize(inactive.map(({ animal }) => animalLabel(animal))),
      ),
    );
  }

  // Rechecagem: pega conflitos anteriores à regra de compromissos e inclusões
  // simultâneas.
  await assertNoConflicts(
    tx,
    handled.map((p) => p.animalId),
    sessionIntent(session.steps, !!reception),
    { sessionId: id },
  );

  if (notHandled.length) {
    await tx.managementParticipant.deleteMany({
      where: { id: { in: notHandled.map((p) => p.id) } },
    });
  }

  // Condicional ao status para não consolidar duas vezes em requisições simultâneas.
  const now = at ?? new Date();
  const confirmed = await tx.managementSession.updateMany({
    where: { id, confirmedAt: null, cancelledAt: null },
    data: { confirmedAt: now },
  });
  if (confirmed.count !== 1) {
    throw new StepError(
      "Somente sessões em andamento podem ser consolidadas.",
      409,
    );
  }

  const steps = [...session.steps].sort(
    (a, b) =>
      stepModule(a.type).consolidateOrder - stepModule(b.type).consolidateOrder,
  );
  for (const step of steps) {
    // Os registros passam a valer com a data e a hora em que foram feitos.
    await stepModule(step.type).consolidate(tx, session, step);
  }

  return { handled: handled.length, removed: notHandled.length };
}
