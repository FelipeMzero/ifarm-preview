import type { SessionAnimalContext } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "@ifarm/domain/errors";
import { loadAnimalContext } from "../animalContext";

// Tudo o que as telas de etapa precisam de um animal da sessão (ver loadAnimalContext).
export async function getSessionAnimal(
  id: string,
  animalId: string,
): Promise<SessionAnimalContext> {
  const context = await loadAnimalContext(prisma, id, animalId);
  if (!context) {
    throw new NotFoundError("Animal não encontrado nesta sessão de manejo.");
  }
  return context;
}
