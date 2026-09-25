import { prisma } from "@/lib/prisma";
import type { Sex } from "@/generated/prisma/enums";

// Unidade Animal: 450 kg de peso vivo.
export const UA_KG = 450;

// Equivalência usada quando o animal não tem peso, mas tem data de nascimento.
const UA_BY_AGE = {
  upTo12Months: 0.4,
  upTo24Months: 0.75,
  adult: 1,
  adultBull: 1.25,
} as const;

// Sem peso e sem idade: conta como 1 UA para não subestimar a ocupação.
const UA_FALLBACK = 1;

export type UaAnimal = {
  currentWeight: number | null;
  birthDate: Date | null;
  sex: Sex;
  neutered: boolean;
};

function ageInMonths(birthDate: Date, now: Date) {
  return (
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth())
  );
}

// UA de um animal: pelo peso quando houver; senão estimada pela idade; senão 1 UA.
export function animalUnits(
  animal: UaAnimal,
  now = new Date(),
): { ua: number; estimated: boolean } {
  if (animal.currentWeight != null && animal.currentWeight > 0) {
    return { ua: animal.currentWeight / UA_KG, estimated: false };
  }

  if (animal.birthDate) {
    const months = ageInMonths(animal.birthDate, now);
    if (months <= 12) return { ua: UA_BY_AGE.upTo12Months, estimated: true };
    if (months <= 24) return { ua: UA_BY_AGE.upTo24Months, estimated: true };
    const isBull = animal.sex === "MALE" && !animal.neutered;
    return {
      ua: isBull ? UA_BY_AGE.adultBull : UA_BY_AGE.adult,
      estimated: true,
    };
  }

  return { ua: UA_FALLBACK, estimated: true };
}

type UaTotal = { ua: number; count: number; estimatedCount: number };

function sumUnits(animals: UaAnimal[], now: Date): UaTotal {
  return animals.reduce<UaTotal>(
    (acc, a) => {
      const { ua, estimated } = animalUnits(a, now);
      return {
        ua: acc.ua + ua,
        count: acc.count + 1,
        estimatedCount: acc.estimatedCount + (estimated ? 1 : 0),
      };
    },
    { ua: 0, count: 0, estimatedCount: 0 },
  );
}

const UA_SELECT = {
  id: true,
  currentWeight: true,
  birthDate: true,
  sex: true,
  neutered: true,
} as const;

function toUaAnimal(a: {
  currentWeight: { toNumber(): number } | null;
  birthDate: Date | null;
  sex: Sex;
  neutered: boolean;
}): UaAnimal {
  return {
    currentWeight: a.currentWeight?.toNumber() ?? null,
    birthDate: a.birthDate,
    sex: a.sex,
    neutered: a.neutered,
  };
}

export type StockingPreview = {
  area: { id: string; name: string };
  capacityUa: number;
  current: UaTotal;
  incoming: UaTotal;
  projectedUa: number;
  exceeds: boolean;
};

// Ocupação de uma área (em UA) antes e depois de receber animais. A área alvo vem
// de `areaId` ou da área atual de `batchId`. Entram na conta os animais listados,
// os lotes inteiros em `batchIds` e animais ainda não cadastrados (`newAnimals`);
// quem já está na área não é contado duas vezes.
export async function stockingPreview(params: {
  areaId?: string;
  batchId?: string;
  animalIds?: string[];
  batchIds?: string[];
  newAnimals?: UaAnimal[];
}): Promise<StockingPreview | null> {
  const { batchId, animalIds = [], batchIds = [], newAnimals = [] } = params;

  let areaId = params.areaId;
  if (!areaId && batchId) {
    const active = await prisma.batchAreaHistory.findFirst({
      where: { batchId, exitedAt: null },
      select: { areaId: true },
    });
    areaId = active?.areaId;
  }
  if (!areaId) return null;

  const area = await prisma.area.findUnique({
    where: { id: areaId },
    select: { id: true, name: true, hectares: true, stockingRate: true },
  });
  if (!area) return null;

  const [inArea, incomingAnimals] = await Promise.all([
    prisma.animal.findMany({
      where: {
        status: "ACTIVE",
        currentBatch: {
          closedAt: null,
          batchAreaHistories: { some: { areaId, exitedAt: null } },
        },
      },
      select: UA_SELECT,
    }),
    animalIds.length || batchIds.length
      ? prisma.animal.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { id: { in: animalIds } },
              { currentBatchId: { in: batchIds } },
            ],
          },
          select: UA_SELECT,
        })
      : Promise.resolve([]),
  ]);

  const inAreaIds = new Set(inArea.map((a) => a.id));
  const now = new Date();
  const current = sumUnits(inArea.map(toUaAnimal), now);
  const incoming = sumUnits(
    [
      ...incomingAnimals.filter((a) => !inAreaIds.has(a.id)).map(toUaAnimal),
      ...newAnimals,
    ],
    now,
  );

  const capacityUa = area.hectares.toNumber() * area.stockingRate.toNumber();
  const projectedUa = current.ua + incoming.ua;

  return {
    area: { id: area.id, name: area.name },
    capacityUa,
    current,
    incoming,
    projectedUa,
    exceeds: projectedUa > capacityUa,
  };
}

export type AreaOccupancy = {
  batch: { id: string; name: string };
  /** Entrada do lote atual na área (início do período de ocupação). */
  occupiedSince: string;
  animalCount: number;
  currentUa: number;
  estimatedCount: number;
  capacityUa: number;
  exceeds: boolean;
};

// Ocupação atual de várias áreas de uma vez (para o mapa): lote aberto em cada área,
// quantidade de animais e UA. Áreas livres ficam fora do mapa retornado.
export async function areasOccupancy(
  areas: { id: string; hectares: number; stockingRate: number }[],
): Promise<Map<string, AreaOccupancy>> {
  const result = new Map<string, AreaOccupancy>();
  if (!areas.length) return result;

  const histories = await prisma.batchAreaHistory.findMany({
    where: {
      areaId: { in: areas.map((a) => a.id) },
      exitedAt: null,
      batch: { closedAt: null },
    },
    select: {
      areaId: true,
      enteredAt: true,
      batch: { select: { id: true, name: true } },
    },
  });
  if (!histories.length) return result;

  const animals = await prisma.animal.findMany({
    where: {
      status: "ACTIVE",
      currentBatchId: { in: histories.map((h) => h.batch.id) },
    },
    select: { ...UA_SELECT, currentBatchId: true },
  });

  const now = new Date();
  const byBatch = new Map<string, UaAnimal[]>();
  for (const a of animals) {
    const list = byBatch.get(a.currentBatchId!) ?? [];
    list.push(toUaAnimal(a));
    byBatch.set(a.currentBatchId!, list);
  }

  const areaById = new Map(areas.map((a) => [a.id, a]));
  for (const h of histories) {
    const area = areaById.get(h.areaId)!;
    const total = sumUnits(byBatch.get(h.batch.id) ?? [], now);
    const capacityUa = area.hectares * area.stockingRate;
    result.set(h.areaId, {
      batch: h.batch,
      occupiedSince: h.enteredAt.toISOString(),
      animalCount: total.count,
      currentUa: total.ua,
      estimatedCount: total.estimatedCount,
      capacityUa,
      exceeds: total.ua > capacityUa,
    });
  }

  return result;
}

// Última saída de lote de cada área (início do período de descanso). Áreas que
// nunca foram ocupadas ficam fora do mapa retornado.
export async function areasLastExit(
  areaIds: string[],
): Promise<Map<string, string>> {
  if (!areaIds.length) return new Map();
  const rows = await prisma.batchAreaHistory.groupBy({
    by: ["areaId"],
    where: { areaId: { in: areaIds }, exitedAt: { not: null } },
    _max: { exitedAt: true },
  });
  return new Map(
    rows
      .filter((r) => r._max.exitedAt)
      .map((r) => [r.areaId, r._max.exitedAt!.toISOString()]),
  );
}
