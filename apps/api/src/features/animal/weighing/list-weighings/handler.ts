import type { AnimalWeighing } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { effectiveWeighing } from "../../../management-session/effective.public";
import { animalStays } from "../../../property/time-zone.public";
import { sortWeighings, toWeighingDto } from "../history.public";

// Pesagens válidas, da mais antiga para a mais recente.
export async function listWeighings(
  animalId: string,
): Promise<AnimalWeighing[]> {
  // As canceladas vêm junto: são as versões anteriores das corrigidas.
  const all = await prisma.animalWeighing.findMany({
    where: { animalId, ...effectiveWeighing },
  });
  const items = all.filter((w) => !w.cancelledAt);
  if (!items.length) return [];
  const { zoneOf } = await animalStays(animalId);
  return sortWeighings(items.map((w) => toWeighingDto(w, zoneOf, all)));
}
