import { DAY_MS } from "@ifarm/shared";

export type LinearRegression = {
  gmd: number;
  intercept: number;
  r2: number;
  refTimestamp: number;
};

export type WeighingPoint = {
  timestamp: number;
  weightKg: number;
};

// Calcula a regressão linear simples (y = mx + b) sobre uma série de pesagens,
// onde x representa os dias decorridos a partir da primeira pesagem e y o peso em kg.
export function calculateLinearRegression(
  points: WeighingPoint[],
): LinearRegression | null {
  if (!points || points.length < 2) return null;

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const refTimestamp = sorted[0].timestamp;
  const n = sorted.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of sorted) {
    const x = (p.timestamp - refTimestamp) / DAY_MS;
    const y = p.weightKg;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const numerator = n * sumXY - sumX * sumY;
  const m = numerator / denominator;
  const b = (sumY - m * sumX) / n;

  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominatorSq = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);

  let r2 = 0;
  if (rDenominatorSq > 0) {
    const r = rNumerator / Math.sqrt(rDenominatorSq);
    r2 = r * r;
  }

  return {
    gmd: Math.round(m * 1000) / 1000,
    intercept: b,
    r2: Math.min(1, Math.max(0, Math.round(r2 * 1000) / 1000)),
    refTimestamp,
  };
}

export type SlaughterProjectionResult = {
  projectedDate: Date | null;
  daysRemaining: number | null;
  projectedAdg: number;
  confidenceR2: number;
};

// Projeta a data em que o animal atingirá o peso alvo de abate (ex.: 450 kg).
export function projectSlaughterDate(params: {
  regression: LinearRegression | null;
  currentWeightKg: number;
  targetWeightKg: number;
  referenceDate?: Date;
  fallbackGmd?: number | null;
}): SlaughterProjectionResult {
  const {
    regression,
    currentWeightKg,
    targetWeightKg,
    referenceDate = new Date(),
    fallbackGmd,
  } = params;

  if (currentWeightKg >= targetWeightKg) {
    return {
      projectedDate: referenceDate,
      daysRemaining: 0,
      projectedAdg: regression?.gmd ?? 0,
      confidenceR2: regression?.r2 ?? 1,
    };
  }

  if (regression && regression.gmd > 0) {
    const xDias = (targetWeightKg - regression.intercept) / regression.gmd;
    const projectedTime = regression.refTimestamp + xDias * DAY_MS;
    const daysRemaining = Math.max(
      0,
      Math.ceil((projectedTime - referenceDate.getTime()) / DAY_MS),
    );
    return {
      projectedDate: new Date(projectedTime),
      daysRemaining,
      projectedAdg: regression.gmd,
      confidenceR2: regression.r2,
    };
  }

  if (fallbackGmd && fallbackGmd > 0) {
    const daysRemaining = Math.max(
      0,
      Math.ceil((targetWeightKg - currentWeightKg) / fallbackGmd),
    );
    const projectedTime = referenceDate.getTime() + daysRemaining * DAY_MS;
    return {
      projectedDate: new Date(projectedTime),
      daysRemaining,
      projectedAdg: Math.round(fallbackGmd * 1000) / 1000,
      confidenceR2: 0.5,
    };
  }

  return {
    projectedDate: null,
    daysRemaining: null,
    projectedAdg: 0,
    confidenceR2: 0,
  };
}

export type AreaRestInfo = {
  id: string;
  name: string;
  hectares: number;
  stockingRate: number;
  defaultRestDays: number | null;
};

export type PastureStatusComputation = {
  summary: {
    available: number;
    occupied: number;
    resting: number;
    total: number;
  };
  readyPastures: {
    id: string;
    name: string;
    hectares: number;
    daysResting: number;
    minRestDays: number;
    stockingRate: number;
    capacityUa: number;
  }[];
};

// Computa a situação de cada pastagem e identifica quais estão aptas para uso imediato.
export function computePastureStatus(
  areas: AreaRestInfo[],
  occupiedAreaIds: Set<string>,
  lastExitedMap: Map<string, Date>,
  referenceDate = new Date(),
): PastureStatusComputation {
  let available = 0;
  let occupied = 0;
  let resting = 0;

  const readyPastures: PastureStatusComputation["readyPastures"] = [];

  for (const area of areas) {
    if (occupiedAreaIds.has(area.id)) {
      occupied++;
      continue;
    }

    const lastExit = lastExitedMap.get(area.id);
    const minRest = area.defaultRestDays ?? 0;

    if (!lastExit) {
      available++;
      readyPastures.push({
        id: area.id,
        name: area.name,
        hectares: area.hectares,
        daysResting: minRest,
        minRestDays: minRest,
        stockingRate: area.stockingRate,
        capacityUa: Math.round(area.hectares * area.stockingRate * 10) / 10,
      });
      continue;
    }

    const daysResting = Math.max(
      0,
      Math.floor((referenceDate.getTime() - lastExit.getTime()) / DAY_MS),
    );

    if (daysResting >= minRest) {
      available++;
      readyPastures.push({
        id: area.id,
        name: area.name,
        hectares: area.hectares,
        daysResting,
        minRestDays: minRest,
        stockingRate: area.stockingRate,
        capacityUa: Math.round(area.hectares * area.stockingRate * 10) / 10,
      });
    } else {
      resting++;
    }
  }

  return {
    summary: {
      available,
      occupied,
      resting,
      total: areas.length,
    },
    readyPastures: readyPastures.sort((a, b) => b.daysResting - a.daysResting),
  };
}

// Categoriza o animal conforme parâmetros zootécnicos usuais (idade, sexo e castração).
export function categorizeAnimal(
  animal: {
    sex: "MALE" | "FEMALE";
    neutered: boolean;
    birthDate: Date | null;
  },
  referenceDate = new Date(),
): string {
  let months: number | null = null;
  if (animal.birthDate) {
    months =
      (referenceDate.getUTCFullYear() - animal.birthDate.getUTCFullYear()) *
        12 +
      (referenceDate.getUTCMonth() - animal.birthDate.getUTCMonth());
  }

  if (months != null && months < 12) {
    return animal.sex === "MALE" ? "Bezerros (< 1 ano)" : "Bezerras (< 1 ano)";
  }

  if (months != null && months <= 24) {
    return animal.sex === "MALE"
      ? "Garrotes (1 a 2 anos)"
      : "Novilhas (1 a 2 anos)";
  }

  if (animal.sex === "FEMALE") {
    return "Vacas (> 2 anos)";
  }

  return animal.neutered
    ? "Bois Castrados (> 2 anos)"
    : "Touros Inteiros (> 2 anos)";
}
