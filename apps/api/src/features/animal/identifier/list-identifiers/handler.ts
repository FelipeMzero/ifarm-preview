import type { IdentifierKind } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { animalStays } from "../../../property/time-zone";
import { ADAPTERS, toIdentifierDto } from "../shared";

// Histórico válido (não excluído), do mais recente para o mais antigo.
export async function listIdentifiers(kind: IdentifierKind, animalId: string) {
  const records = await ADAPTERS[kind].list(prisma, animalId);
  if (!records.length) return [];
  const { zoneOf } = await animalStays(animalId);
  return records.map((r) => toIdentifierDto(r, zoneOf));
}
