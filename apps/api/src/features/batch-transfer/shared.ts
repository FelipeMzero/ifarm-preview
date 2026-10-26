import { prisma } from "@ifarm/db";
import { ValidationError } from "@ifarm/domain/errors";
import { blockedTransferAnimals } from "./rules";
import { animalLabel, summarize } from "../animal/rules";

// Usados por mais de uma operação de transferência.

// Valida o lote de destino e os animais do plano (ValidationError com o erro no campo). Os animais podem vir de lotes
// diferentes (ou de nenhum), mas precisam estar ativos na propriedade e fora do
// lote de destino — tanto ao salvar quanto na confirmação.
export async function validateTransferPlan(params: {
  propertyId: string;
  destinationBatchId: string;
  animalIds: string[];
}) {
  const { propertyId, destinationBatchId, animalIds } = params;

  const destination = await prisma.batch.findFirst({
    where: { id: destinationBatchId, propertyId, closedAt: null },
    select: { id: true },
  });

  if (!destination) {
    throw new ValidationError("Lote de destino inválido.", {
      destinationBatchId:
        "Lote inválido ou inativo para a propriedade selecionada.",
    });
  }

  const uniqueIds = [...new Set(animalIds)];
  if (!uniqueIds.length) return;

  const animals = await prisma.animal.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      code: true,
      currentTag: true,
      currentRfid: true,
      status: true,
      currentPropertyId: true,
      currentBatchId: true,
    },
  });
  const foundIds = new Set(animals.map((a) => a.id));
  const unknown = uniqueIds.filter((id) => !foundIds.has(id));
  const { unavailable, alreadyInDestination } = blockedTransferAnimals(
    animals,
    propertyId,
    destinationBatchId,
  );
  const inactive = [
    ...unavailable.map(animalLabel),
    ...unknown.map(() => "desconhecido"),
  ];

  const messages: string[] = [];
  if (inactive.length) {
    messages.push(
      `Animais que não estão ativos na propriedade: ${summarize(inactive)}.`,
    );
  }
  if (alreadyInDestination.length) {
    messages.push(
      `Animais que já estão no lote de destino: ${summarize(alreadyInDestination.map(animalLabel))}.`,
    );
  }

  if (messages.length) {
    throw new ValidationError("Animais inválidos.", {
      animalIds: messages.join(" "),
    });
  }
}
