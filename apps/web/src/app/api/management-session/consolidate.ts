import { animalLabel, summarize } from "../batch-transfer/shared";
import { findReception } from "../purchase/reception";
import {
  requireManagementDate,
  requireSessionIn,
  startOfToday,
  StepError,
} from "./shared";
import { countDone, loadStepRecords, stepModule } from "./steps";
import type { Tx } from "./steps/types";

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

  const today = startOfToday();
  if (session.managementDate > today) {
    throw new StepError(
      "A data do manejo é futura. Ajuste a data para consolidar.",
    );
  }

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
  const handled = participants.filter(
    (p) => reception || countDone(records, p.animalId),
  );
  const notHandled = participants.filter(
    (p) => !reception && !countDone(records, p.animalId),
  );

  if (!handled.length) {
    throw new StepError(
      reception
        ? "Nenhum animal foi recebido. Receba ao menos um animal antes de consolidar."
        : "Nenhum animal foi manejado. Registre ao menos um animal antes de consolidar.",
    );
  }

  const inactive = handled.filter(
    ({ animal }) =>
      animal.status !== "ACTIVE" ||
      animal.currentPropertyId !== session.propertyId,
  );
  if (inactive.length) {
    throw new StepError(
      `Animais manejados que não estão mais ativos na propriedade: ${summarize(
        inactive.map(({ animal }) => animalLabel(animal)),
      )}. Remova-os da sessão antes de consolidar.`,
    );
  }

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

  // Manejo de hoje usa o horário da consolidação (como nas transferências).
  const effectiveAt =
    session.managementDate.getTime() === today.getTime()
      ? now
      : session.managementDate;

  const steps = [...session.steps].sort(
    (a, b) =>
      stepModule(a.type).consolidateOrder - stepModule(b.type).consolidateOrder,
  );
  for (const step of steps) {
    await stepModule(step.type).consolidate(tx, session, step, effectiveAt);
  }

  return { handled: handled.length, removed: notHandled.length };
}
