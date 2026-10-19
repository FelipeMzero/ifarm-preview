import { cn } from "@/lib/utils";
import { type AreaRow } from "@ifarm/shared";

export type AreaStatus =
  "free" | "ready" | "occupied" | "near" | "exceeded" | "inactive";

// A partir desta fração da capacidade a área é destacada como "perto do limite".
const NEAR_LIMIT = 0.8;

const DAY_MS = 24 * 60 * 60 * 1000;

const daysSince = (iso: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));

const formatDate = (date: Date) => date.toLocaleDateString("pt-BR");

// Rodízio da área: há quanto tempo está ocupada ou em descanso, comparado com os dias
// de referência cadastrados. Sem referência, só a contagem de dias é informada.
export type AreaRotation =
  | {
      kind: "occupation";
      days: number;
      since: string;
      limit: number | null;
      overdue: boolean;
    }
  | {
      kind: "rest";
      /** null quando a área nunca foi ocupada. */
      days: number | null;
      since: string | null;
      limit: number | null;
      ready: boolean;
      readyAt: Date | null;
    };

export function areaRotation(
  area: AreaRow,
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
    // Nunca ocupada: está pronta (se houver referência de descanso).
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
        ? new Date(new Date(area.lastExitAt).getTime() + limit * DAY_MS)
        : null,
  };
}

// Ocupadas: semáforo pela lotação (verde até 80%, amarelo até 100%, vermelho acima).
// Livres: "pronta" quando já cumpriu os dias de descanso; senão cinza.
export function areaStatus(area: AreaRow): AreaStatus {
  if (area.closedAt) return "inactive";
  const occupancy = area.occupancy;
  if (!occupancy) {
    const rotation = areaRotation(area);
    return rotation?.kind === "rest" && rotation.ready ? "ready" : "free";
  }
  if (occupancy.exceeds) return "exceeded";
  return occupancy.currentUa >= occupancy.capacityUa * NEAR_LIMIT
    ? "near"
    : "occupied";
}

// Classes aplicadas ao <path> do polígono no Leaflet. CSS tem precedência sobre os
// atributos fill/stroke que o Leaflet grava, então as cores seguem o tema.
export const AREA_STATUS_PATH_CLASS: Record<AreaStatus, string> = {
  occupied: "fill-primary stroke-primary",
  near: "fill-warning stroke-warning",
  exceeded: "fill-destructive stroke-destructive",
  // Cores fixas: o mapa (tiles) é claro nos dois temas.
  free: "fill-muted-foreground stroke-neutral-600",
  ready: "fill-sky-500 stroke-sky-700",
  inactive: "fill-muted-foreground stroke-neutral-600",
};

/** Opacidade do preenchimento por situação (as livres são tracejadas). */
export const AREA_STATUS_FILL_OPACITY: Record<AreaStatus, number> = {
  occupied: 0.3,
  near: 0.3,
  exceeded: 0.3,
  free: 0.5,
  ready: 0.35,
  inactive: 0.5,
};

export const AREA_STATUS_LABELS: Record<AreaStatus, string> = {
  occupied: "Ocupada (até 80%)",
  near: "Perto do limite (80–100%)",
  exceeded: "Lotação excedida",
  free: "Livre (em descanso)",
  ready: "Livre (descansada)",
  inactive: "Inativa",
};

// Amostra de cor da legenda (mesmas cores do polígono).
export const AREA_STATUS_SWATCH: Record<AreaStatus, string> = {
  occupied: "border-primary bg-primary/30",
  near: "border-warning bg-warning/30",
  exceeded: "border-destructive bg-destructive/30",
  free: "border-dashed border-neutral-600 bg-muted-foreground/50",
  ready: "border-dashed border-sky-700 bg-sky-500/35",
  inactive: "border-dashed border-neutral-600 bg-muted-foreground/50",
};

export function formatUa(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function occupancyPercent(occupancy: NonNullable<AreaRow["occupancy"]>) {
  return occupancy.capacityUa > 0
    ? Math.round((occupancy.currentUa / occupancy.capacityUa) * 100)
    : null;
}

/** Situação curta da área livre (segunda linha do rótulo do mapa). */
export function restStateLabel(rotation: AreaRotation | null): string {
  if (!rotation || rotation.kind !== "rest") return "Livre";
  if (rotation.ready) return "Descansada";
  return rotation.days != null ? "Em descanso" : "Livre";
}

/** Contagem de dias do rodízio (terceira linha do rótulo do mapa). */
export function rotationDaysLabel(
  rotation: AreaRotation | null,
): string | null {
  if (!rotation || rotation.days == null) return null;
  return rotation.limit != null
    ? `${rotation.days}/${rotation.limit} dias`
    : `${rotation.days} dias`;
}

function RotationLine({ rotation }: { rotation: AreaRotation }) {
  if (rotation.kind === "occupation") {
    const extra = rotation.limit != null ? rotation.days - rotation.limit : 0;
    return (
      <div className={cn(rotation.overdue && "font-medium text-destructive")}>
        <span className="text-muted-foreground">Na área há: </span>
        {rotation.days} dia(s)
        {rotation.limit != null && ` (referência: ${rotation.limit})`}
        {rotation.overdue && ` · ${extra} além do prazo, precisa de descanso`}
      </div>
    );
  }

  if (rotation.days == null) {
    return (
      <div>
        <span className="text-muted-foreground">Descanso: </span>
        nunca ocupada{rotation.ready && ", pronta para receber"}
      </div>
    );
  }

  return (
    <div className={cn(rotation.ready && "font-medium text-sky-700")}>
      <span className="text-muted-foreground">Em descanso há: </span>
      {rotation.days} dia(s)
      {rotation.limit != null && ` (referência: ${rotation.limit})`}
      {rotation.ready
        ? " · pronta para receber"
        : rotation.readyAt && ` · pronta em ${formatDate(rotation.readyAt)}`}
    </div>
  );
}

// Resumo da ocupação (popup do mapa e detalhes da área). Usa <div> em vez de <p>:
// o CSS do Leaflet aplica margem grande a todo <p> dentro do popup.
export function OccupancySummary({
  area,
  className,
}: {
  area: AreaRow;
  className?: string;
}) {
  const status = areaStatus(area);
  const occupancy = area.occupancy;
  const rotation = areaRotation(area);

  if (!occupancy) {
    return (
      <div className={cn("space-y-0.5 text-xs", className)}>
        <div className="text-muted-foreground">
          {status === "inactive"
            ? "Área inativa."
            : "Livre: nenhum lote na área."}
        </div>
        {rotation && <RotationLine rotation={rotation} />}
      </div>
    );
  }

  const percent = occupancyPercent(occupancy);

  return (
    <div className={cn("space-y-0.5 text-xs", className)}>
      <div>
        <span className="text-muted-foreground">Lote: </span>
        <span className="font-medium">{occupancy.batch.name}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Animais: </span>
        {occupancy.animalCount}
      </div>
      <div
        className={cn(
          status === "near" && "font-medium text-warning",
          status === "exceeded" && "font-medium text-destructive",
        )}
      >
        <span className="text-muted-foreground">Lotação: </span>
        {formatUa(occupancy.currentUa)} de {formatUa(occupancy.capacityUa)} UA
        {percent != null && ` (${percent}%)`}
      </div>
      {rotation && <RotationLine rotation={rotation} />}
      {occupancy.estimatedCount > 0 && (
        <div className="text-muted-foreground">
          {occupancy.estimatedCount} animal(is) sem peso (UA estimada).
        </div>
      )}
    </div>
  );
}
