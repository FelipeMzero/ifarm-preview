import type { AnimalDetail } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";
import { effectiveNeutering } from "../../management-session/effective";

// Com recastração há mais de um registro: vale o mais recente.
function latestNeuteringDate(items: { neuteredAt: Date }[]): string | null {
  const dates = items.map((item) => item.neuteredAt.toISOString());
  return dates.sort().at(-1) ?? null;
}

// Animal para edição.
export async function getAnimal(id: string): Promise<AnimalDetail> {
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      breed: { select: { id: true, name: true } },
      currentBatch: { select: { id: true, name: true } },
      animalNeuterings: {
        where: { cancelledAt: null, ...effectiveNeutering },
        select: { neuteredAt: true },
      },
    },
  });
  if (!animal) throw new NotFoundError("Animal não encontrado.");

  return {
    id: animal.id,
    currentTag: animal.currentTag,
    currentRfid: animal.currentRfid,
    name: animal.name,
    sex: animal.sex,
    birthDate: animal.birthDate ? fromDbDate(animal.birthDate) : null,
    breedId: animal.breedId,
    breedName: animal.breed?.name ?? null,
    origin: animal.origin,
    status: animal.status,
    neutered: animal.neutered,
    neuteredAt: latestNeuteringDate(animal.animalNeuterings),
    currentBatchId: animal.currentBatchId,
    currentBatchName: animal.currentBatch?.name ?? null,
    currentPropertyId: animal.currentPropertyId,
    currentWeightKg: animal.currentWeight?.toNumber() ?? null,
    updatedAt: animal.updatedAt.toISOString(),
  };
}
