import { prisma } from "@ifarm/db";
import { loadAnimalContext } from "../animal-context";
import { saveAnimalStep } from "../records";

// Registra (ou corrige) uma etapa do manejo no animal. Devolve o contexto atualizado do
// animal (ver loadAnimalContext), para a tela seguir sem outra requisição.
export async function saveSessionAnimalStep(
  id: string,
  animalId: string,
  key: string,
  body: unknown,
) {
  await prisma.$transaction((tx) =>
    saveAnimalStep(tx, id, animalId, key, body),
  );
  return loadAnimalContext(prisma, id, animalId);
}
