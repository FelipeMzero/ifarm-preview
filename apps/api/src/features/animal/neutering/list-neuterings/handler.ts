import type { AnimalNeuteringRecord } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveNeutering } from "../../../management-session/effective";
import { neuteringInclude, toNeuteringDto } from "../shared";

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
export async function listNeuterings(
  animalId: string,
): Promise<AnimalNeuteringRecord[]> {
  const items = await prisma.animalNeutering.findMany({
    where: { animalId, cancelledAt: null, ...effectiveNeutering },
    include: neuteringInclude,
  });
  return items
    .map(toNeuteringDto)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
