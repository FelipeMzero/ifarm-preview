import { OPEN_SESSION_STATUSES } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import {
  findReception,
  removeReceivedAnimal,
} from "../../../purchase/reception.public";
import { requireSessionIn, StepError } from "../../shared";
import { stepModule } from "../../steps";

// Tira o animal da sessão, desfazendo os registros que ele já tinha. Numa recepção de
// compra, o animal recebido é apagado.
export async function removeParticipant(id: string, animalId: string) {
  await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "Somente sessões não consolidadas podem ser alteradas.",
    );

    for (const step of session.steps) {
      await stepModule(step.type).clear(tx, session, step, animalId);
    }

    const removed = await tx.managementParticipant.deleteMany({
      where: { managementSessionId: id, animalId },
    });
    if (removed.count !== 1) {
      throw new StepError("O animal não participa desta sessão.", 404);
    }

    // Na recepção o animal foi criado aqui: sair da sessão desfaz o recebimento.
    const reception = await findReception(tx, id);
    if (reception) await removeReceivedAnimal(tx, reception, animalId);
  });
}
