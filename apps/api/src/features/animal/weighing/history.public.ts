import { instantToZonedIso } from "@ifarm/shared";
import type { AnimalWeighing } from "@ifarm/db/client";
import { toZonedIso, type ZoneOf } from "../../property/time-zone.public";
import { previousVersions } from "../rules";

// Histórico de pesagens do animal no formato da API: usado pelas operações de pesagem, pela
// ficha do animal e pelo painel do lote.

// A data da pesagem vai no fuso da propriedade onde ela aconteceu (`zoneOf`). `all` são as
// pesagens do animal, inclusive canceladas, de onde saem as versões anteriores da corrigida.
export function toWeighingDto(
  w: AnimalWeighing,
  zoneOf: ZoneOf,
  all: AnimalWeighing[] = [],
) {
  return {
    id: w.id,
    date: instantToZonedIso(w.weighedAt, zoneOf(w.weighedAt)),
    weightKg: w.weight.toNumber(),
    notes: w.notes,
    fromSession: w.managementId != null,
    // Uma correção é um registro novo: foi corrigida quando ele foi criado.
    correctedAt:
      w.replacesId != null
        ? toZonedIso(w.createdAt, zoneOf(w.createdAt))
        : null,
    previousVersions: previousVersions(w, all).map((v) => ({
      recordedAt: instantToZonedIso(v.createdAt, zoneOf(v.createdAt)),
      date: instantToZonedIso(v.weighedAt, zoneOf(v.weighedAt)),
      weightKg: v.weight.toNumber(),
      notes: v.notes,
    })),
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
