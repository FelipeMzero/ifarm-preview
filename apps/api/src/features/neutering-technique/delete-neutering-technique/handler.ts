import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { findNeuteringTechniqueOrThrow } from "../shared";

// Exclusão bloqueada se houver castração vinculada (use a inativação).
export async function deleteNeuteringTechnique(id: string) {
  await findNeuteringTechniqueOrThrow(id);
  await write(() => prisma.neuteringTechnique.delete({ where: { id } }));
}
