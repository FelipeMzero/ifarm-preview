import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Relações necessárias para exibir a técnica (atual e a lançada originalmente).
export const neuteringInclude = {
  technique: { select: { name: true } },
  originalTechnique: { select: { name: true } },
} satisfies Prisma.AnimalNeuteringInclude;

type NeuteringWithTechnique = Prisma.AnimalNeuteringGetPayload<{
  include: typeof neuteringInclude;
}>;

export function toNeuteringDto(n: NeuteringWithTechnique) {
  return {
    id: n.id,
    date: n.neuteredAt.toISOString(),
    techniqueId: n.techniqueId,
    techniqueName: n.technique?.name ?? null,
    notes: n.notes,
    fromSession: n.managementId != null,
    correctedAt: n.correctedAt?.toISOString() ?? null,
    originalDate: n.originalNeuteredAt?.toISOString() ?? null,
    originalTechniqueId: n.originalTechniqueId,
    originalTechniqueName: n.originalTechnique?.name ?? null,
  };
}

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
export const REQUIRED_TECHNIQUE_MESSAGE = "Informe a técnica.";
