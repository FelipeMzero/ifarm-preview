import type { AnimalWeighing } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveWeighing } from "../../../management-session/effective";
import { animalStays } from "../../../property/time-zone";
import { sortWeighings, toWeighingDto } from "../shared";

// Pesagens válidas, da mais antiga para a mais recente.
export async function listWeighings(
  animalId: string,
): Promise<AnimalWeighing[]> {
  const items = await prisma.animalWeighing.findMany({
    where: { animalId, cancelledAt: null, ...effectiveWeighing },
  });
  if (!items.length) return [];
  const { zoneOf } = await animalStays(animalId);
  return sortWeighings(items.map((w) => toWeighingDto(w, zoneOf)));
}
