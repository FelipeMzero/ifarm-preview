import type { Prisma } from "@ifarm/db/client";
import { prisma } from "@ifarm/db";

// Técnica de castração informada num registro: conferida pelas operações de castração e pela
// etapa de castração das sessões de manejo.

// Técnica informada precisa existir e estar ativa. `keepId` é a técnica já gravada
// no registro: numa correção, manter uma técnica que foi inativada depois é permitido.
export async function isValidNeuteringTechnique(
  techniqueId: string | null | undefined,
  keepId?: string | null,
  tx: Prisma.TransactionClient = prisma,
) {
  if (!techniqueId || techniqueId === keepId) return true;
  const technique = await tx.neuteringTechnique.findFirst({
    where: { id: techniqueId, deactivatedAt: null },
    select: { id: true },
  });
  return technique != null;
}

export const INVALID_TECHNIQUE_MESSAGE = "Técnica de castração inválida.";
