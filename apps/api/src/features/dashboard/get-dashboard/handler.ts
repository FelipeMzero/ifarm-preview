import { prisma } from "@ifarm/db";
import type {
  DashboardData,
  DashboardQuery,
  DashboardWeightEvolutionItem,
  Sex,
} from "@ifarm/shared";
import { sumUnits, type UaAnimal } from "../../area/stocking.public";
import { NotFoundError } from "../../../lib/errors";
import {
  calculateLinearRegression,
  categorizeAnimal,
  computePastureStatus,
  projectSlaughterDate,
} from "../rules";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

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

export async function getDashboard({
  propertyId,
}: DashboardQuery): Promise<DashboardData> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, productiveArea: true },
  });

  if (!property) {
    throw new NotFoundError("Propriedade não encontrada.");
  }

  const now = new Date();

  // Animais ativos na propriedade
  const animals = await prisma.animal.findMany({
    where: { currentPropertyId: propertyId, status: "ACTIVE" },
    select: {
      id: true,
      code: true,
      name: true,
      currentTag: true,
      currentRfid: true,
      currentWeight: true,
      sex: true,
      neutered: true,
      birthDate: true,
      currentBatch: { select: { id: true, name: true } },
    },
  });

  // Lotes vigentes
  const activeBatches = await prisma.batch.count({
    where: { propertyId, closedAt: null },
  });

  // Pastagens / áreas ativas
  const areas = await prisma.area.findMany({
    where: { propertyId, closedAt: null },
    select: {
      id: true,
      name: true,
      hectares: true,
      stockingRate: true,
      defaultRestDays: true,
    },
  });

  // Históricos de ocupação ativos
  const occupiedHistories = await prisma.batchAreaHistory.findMany({
    where: {
      area: { propertyId },
      exitedAt: null,
      batch: { closedAt: null },
    },
    select: { areaId: true },
  });
  const occupiedAreaIds = new Set(occupiedHistories.map((h) => h.areaId));

  // Última saída registrada para cálculo de descanso
  const lastExitedHistories = await prisma.batchAreaHistory.groupBy({
    by: ["areaId"],
    where: { area: { propertyId }, exitedAt: { not: null } },
    _max: { exitedAt: true },
  });
  const lastExitedMap = new Map<string, Date>();
  for (const h of lastExitedHistories) {
    if (h._max.exitedAt) {
      lastExitedMap.set(h.areaId, h._max.exitedAt);
    }
  }

  // 1. Resumo do Rebanho
  const totalAnimals = animals.length;
  let males = 0;
  let females = 0;
  let totalWeight = 0;
  let weighedCount = 0;

  for (const a of animals) {
    if (a.sex === "MALE") males++;
    else females++;

    if (a.currentWeight != null) {
      totalWeight += a.currentWeight.toNumber();
      weighedCount++;
    }
  }

  const averageWeightKg =
    weighedCount > 0
      ? Math.round((totalWeight / weighedCount) * 10) / 10
      : null;

  // Lotação
  const totalHectares = areas.reduce(
    (sum, a) => sum + a.hectares.toNumber(),
    0,
  );
  const uaSummary = sumUnits(animals.map(toUaAnimal), now);
  const uaPerHa =
    totalHectares > 0
      ? Math.round((uaSummary.ua / totalHectares) * 100) / 100
      : null;

  // 2. Status das Pastagens e Pastos Prontos
  const pastureAreas = areas.map((a) => ({
    id: a.id,
    name: a.name,
    hectares: a.hectares.toNumber(),
    stockingRate: a.stockingRate.toNumber(),
    defaultRestDays: a.defaultRestDays,
  }));

  const pastureComputation = computePastureStatus(
    pastureAreas,
    occupiedAreaIds,
    lastExitedMap,
    now,
  );

  // 3. Distribuição por Categoria
  const categoryCounts = new Map<string, number>();
  for (const a of animals) {
    const cat = categorizeAnimal(
      {
        sex: a.sex,
        neutered: a.neutered,
        birthDate: a.birthDate,
      },
      now,
    );
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const categoryDistribution = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage:
        totalAnimals > 0 ? Math.round((count / totalAnimals) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Evolução do Peso Médio (últimos 6 meses)
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const weighingsLast6Months = await prisma.animalWeighing.findMany({
    where: {
      cancelledAt: null,
      animal: {
        currentPropertyId: propertyId,
        status: "ACTIVE",
      },
      weighedAt: { gte: sixMonthsAgo },
    },
    select: {
      animalId: true,
      weight: true,
      weighedAt: true,
    },
    orderBy: { weighedAt: "asc" },
  });

  // Agrupar pesagens por mês
  const monthlyMap = new Map<
    string,
    { key: string; label: string; totalKg: number; count: number }
  >();

  // Pré-popular os 6 meses para garantir continuidade no gráfico
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
    monthlyMap.set(key, { key, label, totalKg: 0, count: 0 });
  }

  for (const w of weighingsLast6Months) {
    const date = new Date(w.weighedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key);
    if (entry) {
      entry.totalKg += w.weight.toNumber();
      entry.count++;
    }
  }

  const weightEvolution: DashboardWeightEvolutionItem[] = Array.from(
    monthlyMap.values(),
  ).map((item) => ({
    month: item.label,
    averageWeightKg:
      item.count > 0 ? Math.round((item.totalKg / item.count) * 10) / 10 : 0,
    animalCount: item.count,
  }));

  // 5. Projeção de Abate para os animais mais próximos do alvo (alvo padrão: 450 kg)
  const targetWeightKg = 450;
  const weightedAnimals = animals
    .filter((a) => a.currentWeight != null)
    .map((a) => ({
      ...a,
      currentWeightKg: a.currentWeight!.toNumber(),
    }))
    .sort((a, b) => b.currentWeightKg - a.currentWeightKg)
    .slice(0, 8);

  const candidateIds = weightedAnimals.map((a) => a.id);
  const candidateWeighings = candidateIds.length
    ? await prisma.animalWeighing.findMany({
        where: {
          animalId: { in: candidateIds },
          cancelledAt: null,
        },
        select: {
          animalId: true,
          weight: true,
          weighedAt: true,
        },
        orderBy: { weighedAt: "asc" },
      })
    : [];

  const weighingsByAnimal = new Map<
    string,
    { timestamp: number; weightKg: number }[]
  >();
  for (const w of candidateWeighings) {
    const list = weighingsByAnimal.get(w.animalId) ?? [];
    list.push({
      timestamp: new Date(w.weighedAt).getTime(),
      weightKg: w.weight.toNumber(),
    });
    weighingsByAnimal.set(w.animalId, list);
  }

  let totalRegressionGmd = 0;
  let regressionGmdCount = 0;

  const slaughterProjections = weightedAnimals.map((animal) => {
    const points = weighingsByAnimal.get(animal.id) ?? [];
    const regression = calculateLinearRegression(points);

    if (regression && regression.gmd > 0) {
      totalRegressionGmd += regression.gmd;
      regressionGmdCount++;
    }

    const projection = projectSlaughterDate({
      regression,
      currentWeightKg: animal.currentWeightKg,
      targetWeightKg,
      referenceDate: now,
    });

    const identifier =
      animal.currentTag ||
      animal.currentRfid ||
      animal.name ||
      `#${animal.code}`;

    const percentageOfTarget =
      Math.round((animal.currentWeightKg / targetWeightKg) * 1000) / 10;

    return {
      animalId: animal.id,
      identifier,
      batchName: animal.currentBatch?.name ?? null,
      currentWeightKg: animal.currentWeightKg,
      targetWeightKg,
      projectedAdg: projection.projectedAdg,
      projectedSlaughterDate: projection.projectedDate
        ? projection.projectedDate.toISOString().slice(0, 10)
        : null,
      daysRemaining: projection.daysRemaining,
      confidenceR2: projection.confidenceR2,
      percentageOfTarget,
    };
  });

  const averageAdg =
    regressionGmdCount > 0
      ? Math.round((totalRegressionGmd / regressionGmdCount) * 1000) / 1000
      : null;

  return {
    summary: {
      totalAnimals,
      males,
      females,
      activeBatches,
      averageWeightKg,
      averageAdg,
      stockingRate: {
        uaPerHa,
        totalUa: Math.round(uaSummary.ua * 10) / 10,
        totalProductiveHectares: Math.round(totalHectares * 10) / 10,
      },
    },
    pastureStatus: pastureComputation.summary,
    categoryDistribution,
    weightEvolution,
    readyPastures: pastureComputation.readyPastures,
    slaughterProjections,
  };
}
