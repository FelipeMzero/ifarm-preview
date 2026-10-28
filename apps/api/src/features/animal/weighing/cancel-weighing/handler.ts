import { prisma } from "@ifarm/db";
import { findActiveWeighing } from "../shared";
import { recomputeCurrentWeight } from "../current-weight";

// Exclusão lógica da pesagem; o peso atual é recalculado.
export async function cancelWeighing(animalId: string, weighingId: string) {
  const weighing = await findActiveWeighing(animalId, weighingId);

  await prisma.$transaction(async (tx) => {
    await tx.animalWeighing.update({
      where: { id: weighing.id },
      data: { cancelledAt: new Date() },
    });

    await recomputeCurrentWeight(tx, animalId);
  });
}
