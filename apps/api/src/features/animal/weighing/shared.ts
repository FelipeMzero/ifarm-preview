import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { effectiveWeighing } from "../../management-session/effective";

// Pesagem válida do animal (corrigir e excluir); erro 404 se não existir.
export async function findActiveWeighing(animalId: string, weighingId: string) {
  const numericId = Number(weighingId);
  const weighing = Number.isInteger(numericId)
    ? await prisma.animalWeighing.findFirst({
        where: {
          id: numericId,
          animalId,
          cancelledAt: null,
          ...effectiveWeighing,
        },
      })
    : null;
  if (!weighing) throw new NotFoundError("Pesagem não encontrada.");
  return weighing;
}
