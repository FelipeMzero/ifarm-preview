import {
  DAY_MS,
  instantToZonedIso,
  type AreaOccupancy,
  type AreaRotation,
  type AreaStatus,
} from "@ifarm/shared";

// Rodízio e situação das áreas no mapa. Só informam: nenhuma operação é bloqueada.

// A partir desta fração da capacidade a área ocupada fica "perto do limite".
export const NEAR_LIMIT = 0.8;

const daysSince = (iso: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));

type AreaState = {
  closedAt: string | null;
  defaultOccupationDays: number | null;
  defaultRestDays: number | null;
  occupancy: AreaOccupancy | null;
  lastExitAt: string | null;
};

// Ocupada: dias na área contra a ocupação de referência (vencida acima dela). Livre:
// dias de descanso contra o descanso de referência (pronta ao cumpri-lo; nunca ocupada
// já está pronta, se houver referência). Inativa: sem rodízio. A data prevista (readyAt) vai
// no fuso da propriedade (`timeZone`), como as datas de entrada e saída.
export function areaRotation(
  area: AreaState,
  timeZone: string,
  now = new Date(),
): AreaRotation | null {
  if (area.closedAt) return null;

  if (area.occupancy) {
    const days = daysSince(area.occupancy.occupiedSince, now);
    const limit = area.defaultOccupationDays;
    return {
      kind: "occupation",
      days,
      since: area.occupancy.occupiedSince,
      limit,
      overdue: limit != null && days > limit,
    };
  }

  const limit = area.defaultRestDays;
  if (!area.lastExitAt) {
    return {
      kind: "rest",
      days: null,
      since: null,
      limit,
      ready: limit != null,
      readyAt: null,
    };
  }

  const days = daysSince(area.lastExitAt, now);
  return {
    kind: "rest",
    days,
    since: area.lastExitAt,
    limit,
    ready: limit != null && days >= limit,
    readyAt:
      limit != null
        ? instantToZonedIso(
            new Date(Date.parse(area.lastExitAt) + limit * DAY_MS),
            timeZone,
          )
        : null,
  };
}

// Ocupadas: semáforo pela lotação (até 80%, até 100%, acima). Livres: "ready" quando
// já cumpriram o descanso; senão "free".
export function areaStatus(
  area: AreaState,
  rotation: AreaRotation | null,
): AreaStatus {
  if (area.closedAt) return "inactive";
  const occupancy = area.occupancy;
  if (!occupancy) {
    return rotation?.kind === "rest" && rotation.ready ? "ready" : "free";
  }
  if (occupancy.exceeds) return "exceeded";
  return occupancy.currentUa >= occupancy.capacityUa * NEAR_LIMIT
    ? "near"
    : "occupied";
}
