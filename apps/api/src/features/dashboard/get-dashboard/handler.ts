import { prisma } from "@ifarm/db";
import {
  DAY_MS,
  type DashboardBatchGoal,
  type DashboardData,
  type DashboardQuery,
  type DashboardWeightEvolutionItem,
  type DashboardWithdrawalAnimal,
  type Sex,
} from "@ifarm/shared";
import { sumUnits, type UaAnimal } from "../../area/stocking.public";
import { NotFoundError } from "../../../lib/errors";
import {
  calculateLinearRegression,
  categorizeAnimal,
  computeBatchGoals,
  computePastureStatus,
  computeProductiveEfficiency,
  computeRotationAlerts,
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
  batchId,
}: DashboardQuery): Promise<DashboardData> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, productiveArea: true },
  });

  if (!property) {
    throw new NotFoundError("Propriedade não encontrada.");
  }

  const now = new Date();

  // Todos os lotes vigentes da propriedade (usados para o seletor de filtro)
  const propertyBatches = await prisma.batch.findMany({
    where: { propertyId, closedAt: null },
    select: {
      id: true,
      name: true,
      saleGoal: {
        select: {
          targetDate: true,
          targetWeight: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Animais ativos na propriedade (filtrados por lote se batchId informado)
  const animals = await prisma.animal.findMany({
    where: {
      currentPropertyId: propertyId,
      status: "ACTIVE",
      ...(batchId ? { currentBatchId: batchId } : {}),
    },
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
      currentBatchId: true,
      currentBatch: { select: { id: true, name: true } },
    },
  });

  const activeBatchesCount = propertyBatches.length;

  // Pastagens / áreas ativas da propriedade
  const areas = await prisma.area.findMany({
    where: { propertyId, closedAt: null },
    select: {
      id: true,
      name: true,
      hectares: true,
      stockingRate: true,
      defaultRestDays: true,
      defaultOccupationDays: true,
    },
  });

  // Históricos de ocupação ativos
  const occupiedHistories = await prisma.batchAreaHistory.findMany({
    where: {
      area: { propertyId },
      exitedAt: null,
      batch: { closedAt: null },
    },
    select: {
      areaId: true,
      enteredAt: true,
      batchId: true,
      batch: { select: { name: true } },
      area: { select: { name: true, defaultOccupationDays: true } },
    },
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

  const animalIds = animals.map((a) => a.id);

  const weighingsLast6Months = animalIds.length
    ? await prisma.animalWeighing.findMany({
        where: {
          cancelledAt: null,
          animalId: { in: animalIds },
          weighedAt: { gte: sixMonthsAgo },
        },
        select: {
          animalId: true,
          weight: true,
          weighedAt: true,
        },
        orderBy: { weighedAt: "asc" },
      })
    : [];

  const monthlyMap = new Map<
    string,
    { key: string; label: string; totalKg: number; count: number }
  >();

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

  // 5. Projeção de Abate (Predição Linear)
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

  // 6. Alertas Críticos e Rotação
  const rotationAlerts = computeRotationAlerts(
    occupiedHistories.map((h) => ({
      batchId: h.batchId,
      batchName: h.batch.name,
      areaId: h.areaId,
      areaName: h.area.name,
      enteredAt: h.enteredAt,
      defaultOccupationDays: h.area.defaultOccupationDays,
    })),
    now,
  );

  // Animais sem pesagem há mais de 60 dias
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);
  const recentWeighedRows = await prisma.animalWeighing.groupBy({
    by: ["animalId"],
    where: {
      animalId: { in: animalIds },
      cancelledAt: null,
      weighedAt: { gte: sixtyDaysAgo },
    },
  });
  const recentWeighedIds = new Set(recentWeighedRows.map((r) => r.animalId));
  const unweighedAnimalsCount = animalIds.filter(
    (id) => !recentWeighedIds.has(id),
  ).length;

  // Carência sanitária ativa
  const activeWithdrawalItems = await prisma.healthManagementItem.findMany({
    where: {
      cancelledAt: null,
      animal: { currentPropertyId: propertyId, status: "ACTIVE" },
      management: { withdrawalEndDate: { gte: now } },
    },
    select: {
      animalId: true,
      animal: {
        select: {
          currentTag: true,
          currentRfid: true,
          name: true,
          code: true,
        },
      },
      management: {
        select: {
          title: true,
          withdrawalEndDate: true,
          type: { select: { name: true } },
        },
      },
    },
  });

  const activeWithdrawalAnimals: DashboardWithdrawalAnimal[] =
    activeWithdrawalItems.map((item) => {
      const end = item.management.withdrawalEndDate!;
      const days = Math.max(
        0,
        Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
      );
      const identifier =
        item.animal.currentTag ||
        item.animal.currentRfid ||
        item.animal.name ||
        `#${item.animal.code}`;
      const title =
        item.management.title ||
        item.management.type.name ||
        "Tratamento Sanitário";

      return {
        animalId: item.animalId,
        identifier,
        title,
        withdrawalEndDate: end.toISOString().slice(0, 10),
        daysRemaining: days,
      };
    });

  // Compras ativas aguardando entrega / consolidação
  const pendingPurchasesCount = await prisma.purchaseEvent.count({
    where: {
      destinationPropertyId: propertyId,
      confirmedAt: null,
      cancelledAt: null,
    },
  });

  const alerts = {
    rotationAlerts,
    unweighedAnimalsCount,
    activeWithdrawalCount: activeWithdrawalAnimals.length,
    pendingPurchasesCount,
  };

  // 7. Metas de Venda dos Lotes
  const batchesWithGoals = propertyBatches.filter(
    (b) =>
      b.saleGoal &&
      b.saleGoal.targetDate != null &&
      b.saleGoal.targetWeight != null,
  );

  const batchGoalInputs = batchesWithGoals.map((b) => {
    const batchAnimals = animals.filter((a) => a.currentBatchId === b.id);
    const weighed = batchAnimals
      .filter((a) => a.currentWeight != null)
      .map((a) => a.currentWeight!.toNumber());
    const currentAvgWeightKg = weighed.length
      ? Math.round((weighed.reduce((s, w) => s + w, 0) / weighed.length) * 10) /
        10
      : null;

    return {
      batchId: b.id,
      batchName: b.name,
      currentAnimalCount: batchAnimals.length,
      currentAvgWeightKg,
      targetWeightKg: b.saleGoal!.targetWeight!.toNumber(),
      targetDate: b.saleGoal!.targetDate!,
      batchAdg: averageAdg,
    };
  });

  const batchGoals: DashboardBatchGoal[] = computeBatchGoals(
    batchGoalInputs,
    now,
  );

  // 8. Indicadores Sanitários (30 e 90 dias)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);

  const [procedures30d, procedures90d] = await Promise.all([
    prisma.healthManagementItem.count({
      where: {
        cancelledAt: null,
        animal: { currentPropertyId: propertyId, status: "ACTIVE" },
        appliedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.healthManagementItem.count({
      where: {
        cancelledAt: null,
        animal: { currentPropertyId: propertyId, status: "ACTIVE" },
        appliedAt: { gte: ninetyDaysAgo },
      },
    }),
  ]);

  const sanitary = {
    procedures30d,
    procedures90d,
    activeWithdrawalAnimals,
  };

  // 9. Eficiência Produtiva por Hectare
  const occupiedHectares = pastureAreas
    .filter((a) => occupiedAreaIds.has(a.id))
    .reduce((s, a) => s + a.hectares, 0);

  // Estimativa do ganho total do rebanho avaliado nos últimos 30 dias
  const evaluatedDays = 30;
  const activeAdg = averageAdg ?? 0.75; // fallback zootécnico médio
  const totalGainKg = totalAnimals * activeAdg * evaluatedDays;

  const efficiency = computeProductiveEfficiency(
    totalGainKg,
    occupiedHectares,
    evaluatedDays,
  );

  return {
    summary: {
      totalAnimals,
      males,
      females,
      activeBatches: activeBatchesCount,
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
    alerts,
    batchGoals,
    sanitary,
    efficiency,
    batches: propertyBatches.map((b) => ({ id: b.id, name: b.name })),
  };
}
