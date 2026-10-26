import { OPEN_SESSION_STATUSES } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../../animal/commitments";
import { findReception } from "../../../purchase/reception";
import {
  invalidAnimals,
  invalidAnimalsMessage,
  requireSessionIn,
  sessionIntent,
  StepError,
} from "../../shared";

// Inclui na sessão animais que não estavam no planejamento (ex.: apareceram no curral).
// Os que já participam são ignorados. Devolve quantos entraram.
export async function addParticipants(id: string, animalIdsParam: string[]) {
  const animalIds = [...new Set(animalIdsParam)];

  const added = await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "Somente sessões não consolidadas aceitam novos animais.",
    );

    if (await findReception(tx, id)) {
      throw new StepError(
        "Na recepção de compra os animais são criados pelo recebimento, não incluídos da lista.",
        409,
      );
    }

    const invalid = await invalidAnimals(tx, session.propertyId, animalIds);
    if (invalid.length) {
      throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
    }
    await assertNoConflicts(
      tx,
      animalIds,
      sessionIntent(session.steps, false),
      { sessionId: id },
    );

    const created = await tx.managementParticipant.createMany({
      data: animalIds.map((animalId) => ({
        managementSessionId: id,
        animalId,
      })),
      skipDuplicates: true,
    });
    return created.count;
  });
  return { added };
}
