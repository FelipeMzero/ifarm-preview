import type { NeuteringCancelData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveNeutering } from "../../../management-session/effective";
import { findActiveNeutering } from "../shared";

// Exclusão lógica da castração. Sem nenhuma castração restante, o usuário decide se o
// animal continua castrado (pode ter chegado castrado, sem registro). Padrão: não castrado.
export async function cancelNeutering(
  animalId: string,
  neuteringId: string,
  data: NeuteringCancelData,
) {
  const neutering = await findActiveNeutering(animalId, neuteringId);

  await prisma.$transaction(async (tx) => {
    await tx.animalNeutering.update({
      where: { id: neutering.id },
      data: { cancelledAt: new Date() },
    });

    const remaining = await tx.animalNeutering.count({
      where: { animalId, cancelledAt: null, ...effectiveNeutering },
    });
    if (remaining === 0) {
      await tx.animal.update({
        where: { id: animalId },
        data: { neutered: data.keepNeutered ?? false },
      });
    }
  });
}
