import type { IdentifierKind } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { animalStays } from "../../../property/time-zone.public";
import { ADAPTERS, toIdentifierDto } from "../shared";

// Histórico válido (não excluído), do mais recente para o mais antigo.
export async function listIdentifiers(kind: IdentifierKind, animalId: string) {
  // Os cancelados vêm junto: são as versões anteriores dos corrigidos.
  const all = await ADAPTERS[kind].history(prisma, animalId);
  const records = all.filter((r) => !r.cancelledAt);
  if (!records.length) return [];
  const { zoneOf } = await animalStays(animalId);
  return records.map((r) => toIdentifierDto(r, zoneOf, all));
}
