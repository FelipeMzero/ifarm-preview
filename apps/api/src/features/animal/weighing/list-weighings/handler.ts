import type { AnimalWeighing } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveWeighing } from "../../../management-session/effective";
import { sortWeighings, toWeighingDto } from "../shared";

// Pesagens válidas, da mais antiga para a mais recente.
export async function listWeighings(
  animalId: string,
): Promise<AnimalWeighing[]> {
  const items = await prisma.animalWeighing.findMany({
    where: { animalId, cancelledAt: null, ...effectiveWeighing },
  });
  return sortWeighings(items.map(toWeighingDto));
}
