import { prisma } from "@ifarm/db";
import { loadAnimalContext } from "../animalContext";
import { clearAnimalStep } from "../records";

// Desfaz o registro da etapa no animal. Devolve o contexto atualizado, como o anterior.
export async function clearSessionAnimalStep(
  id: string,
  animalId: string,
  key: string,
) {
  await prisma.$transaction((tx) => clearAnimalStep(tx, id, animalId, key));
  return loadAnimalContext(prisma, id, animalId);
}
