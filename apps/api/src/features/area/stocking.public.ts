import {
  instantToZonedIso,
  type AreaOccupancy,
  type Sex,
  type StockingPreview,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { capacityCheck, sumUnits, type UaAnimal } from "./stocking-rules";

// Lotação das áreas em UA (RN-AREA-04), lida do banco: usada pela prévia de lotação, pelo
// mapa de áreas e pelo painel do lote. O cálculo da UA fica em stocking-rules.ts.

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

  const projectedUa = current.ua + incoming.ua;
  const { capacityUa, exceeds } = capacityCheck(
    {
      hectares: area.hectares.toNumber(),
      stockingRate: area.stockingRate.toNumber(),
    },
    projectedUa,
  );

  return {
    area: { id: area.id, name: area.name },
    capacityUa,
    current,
    incoming,
    projectedUa,
    exceeds,
  };
}

// Ocupação atual de várias áreas de uma vez (para o mapa): lote aberto em cada área,
// quantidade de animais e UA (o início da ocupação no fuso da propriedade). Áreas livres ficam
// fora do mapa retornado.
export async function areasOccupancy(
  areas: { id: string; hectares: number; stockingRate: number }[],
  timeZone: string,
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
    result.set(h.areaId, {
      batch: h.batch,
      occupiedSince: instantToZonedIso(h.enteredAt, timeZone),
      animalCount: total.count,
      currentUa: total.ua,
      estimatedCount: total.estimatedCount,
      ...capacityCheck(area, total.ua),
    });
  }

  return result;
}

// Última saída de lote de cada área (início do período de descanso), no fuso da propriedade.
// Áreas que nunca foram ocupadas ficam fora do mapa retornado.
export async function areasLastExit(
  areaIds: string[],
  timeZone: string,
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
      .map((r) => [r.areaId, instantToZonedIso(r._max.exitedAt!, timeZone)]),
  );
}

export {
  sumUnits,
  capacityCheck,
  animalUnits,
  type UaAnimal,
} from "./stocking-rules";
