import { instantToZonedIso } from "@ifarm/shared";
import type { AnimalWeighing } from "@ifarm/db/client";
import { toZonedIso, type ZoneOf } from "../../property/time-zone.public";

// Histórico de pesagens do animal no formato da API: usado pelas operações de pesagem, pela
// ficha do animal e pelo painel do lote.

// A data da pesagem vai no fuso da propriedade onde ela aconteceu (`zoneOf`).
export function toWeighingDto(w: AnimalWeighing, zoneOf: ZoneOf) {
  return {
    id: w.id,
    date: instantToZonedIso(w.weighedAt, zoneOf(w.weighedAt)),
    weightKg: w.weight.toNumber(),
    notes: w.notes,
    fromSession: w.managementId != null,
    correctedAt: w.correctedAt
      ? toZonedIso(w.correctedAt, zoneOf(w.correctedAt))
      : null,
    originalWeightKg: w.originalWeight?.toNumber() ?? null,
  };
}

// Pesagens válidas (não canceladas), da mais antiga para a mais recente.
export function sortWeighings<T extends { date: string; id: number }>(
  list: T[],
): T[] {
  // Pelo instante: as datas podem vir com deslocamentos diferentes.
  return list.sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date) || a.id - b.id,
  );
}
