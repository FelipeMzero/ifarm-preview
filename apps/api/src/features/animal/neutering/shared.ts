import type { Prisma } from "@ifarm/db/client";
import { instantToZonedIso } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { effectiveNeutering } from "../../management-session/effective.public";
import type { ZoneOf } from "../../property/time-zone.public";
import { toZonedIso } from "../../property/time-zone.public";
import { previousVersions } from "../rules";

// Relação necessária para exibir a técnica.
export const neuteringInclude = {
  technique: { select: { name: true } },
} satisfies Prisma.AnimalNeuteringInclude;

type NeuteringWithTechnique = Prisma.AnimalNeuteringGetPayload<{
  include: typeof neuteringInclude;
}>;

// As datas da castração vão no fuso da propriedade onde ela aconteceu (`zoneOf`). `all` são as
// castrações do animal, inclusive canceladas, de onde saem as versões anteriores da corrigida.
export function toNeuteringDto(
  n: NeuteringWithTechnique,
  zoneOf: ZoneOf,
  all: NeuteringWithTechnique[],
) {
  return {
    id: n.id,
    date: instantToZonedIso(n.neuteredAt, zoneOf(n.neuteredAt)),
    techniqueId: n.techniqueId,
    techniqueName: n.technique?.name ?? null,
    notes: n.notes,
    fromSession: n.managementId != null,
    // Uma correção é um registro novo: foi corrigida quando ele foi criado.
    correctedAt:
      n.replacesId != null
        ? toZonedIso(n.createdAt, zoneOf(n.createdAt))
        : null,
    previousVersions: previousVersions(n, all).map((v) => ({
      recordedAt: instantToZonedIso(v.createdAt, zoneOf(v.createdAt)),
      date: instantToZonedIso(v.neuteredAt, zoneOf(v.neuteredAt)),
      techniqueId: v.techniqueId,
      techniqueName: v.technique?.name ?? null,
      notes: v.notes,
    })),
  };
}

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
