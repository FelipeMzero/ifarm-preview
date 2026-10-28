import type { AnimalNeuteringRecord } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveNeutering } from "../../../management-session/effective.public";
import { animalStays } from "../../../property/time-zone.public";
import { neuteringInclude, toNeuteringDto } from "../shared";

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
export async function listNeuterings(
  animalId: string,
): Promise<AnimalNeuteringRecord[]> {
  const items = await prisma.animalNeutering.findMany({
    where: { animalId, cancelledAt: null, ...effectiveNeutering },
    include: neuteringInclude,
  });
  if (!items.length) return [];
  const { zoneOf } = await animalStays(animalId);
  // Pelo instante: as datas podem vir com deslocamentos diferentes.
  return items
    .map((n) => toNeuteringDto(n, zoneOf))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || b.id - a.id);
}
