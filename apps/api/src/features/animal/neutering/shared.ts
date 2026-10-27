import type { Prisma } from "@ifarm/db/client";
import { instantToZonedIso } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { effectiveNeutering } from "../../management-session/effective";
import type { ZoneOf } from "../../property/time-zone";

// Relações necessárias para exibir a técnica (atual e a lançada originalmente).
export const neuteringInclude = {
  technique: { select: { name: true } },
  originalTechnique: { select: { name: true } },
} satisfies Prisma.AnimalNeuteringInclude;

type NeuteringWithTechnique = Prisma.AnimalNeuteringGetPayload<{
  include: typeof neuteringInclude;
}>;

// As datas da castração vão no fuso da propriedade onde ela aconteceu (`zoneOf`).
export function toNeuteringDto(n: NeuteringWithTechnique, zoneOf: ZoneOf) {
  return {
    id: n.id,
    date: instantToZonedIso(n.neuteredAt, zoneOf(n.neuteredAt)),
    techniqueId: n.techniqueId,
    techniqueName: n.technique?.name ?? null,
    notes: n.notes,
    fromSession: n.managementId != null,
    correctedAt: n.correctedAt?.toISOString() ?? null,
    originalDate: n.originalNeuteredAt
      ? instantToZonedIso(n.originalNeuteredAt, zoneOf(n.originalNeuteredAt))
      : null,
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

// Castração válida do animal (corrigir e excluir); erro 404 se não existir.
export async function findActiveNeutering(
  animalId: string,
  neuteringId: string,
) {
  const numericId = Number(neuteringId);
  const neutering = Number.isInteger(numericId)
    ? await prisma.animalNeutering.findFirst({
        where: {
          id: numericId,
          animalId,
          cancelledAt: null,
          ...effectiveNeutering,
        },
      })
    : null;
  if (!neutering) throw new NotFoundError("Castração não encontrada.");
  return neutering;
}
