import {
  dayInZone,
  instantToZonedIso,
  type BatchFullDetails,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";
import { sortWeighings, toWeighingDto } from "../../animal/weighing/shared";
import { stockingPreview } from "../../area/stocking";
import { propertyTimeZone } from "../../property/time-zone";
import { effectiveWeighing } from "../../management-session/effective";
import { averageDailyGain, groupPurchases, weightSeries } from "../rules";

// Painel do lote: animais com GMD, peso médio ao longo do tempo, movimentações,
// transferências pendentes e confirmadas, compras de entrada e lotação da área.
export async function getBatchDetails(id: string): Promise<BatchFullDetails> {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      saleGoal: true,
      property: { select: { id: true, name: true } },
      batchAreaHistories: {
        orderBy: { enteredAt: "desc" },
        include: {
          area: {
            select: {
              id: true,
              name: true,
              hectares: true,
              stockingRate: true,
            },
          },
        },
      },
    },
  });

  if (!batch) throw new NotFoundError("Lote não encontrado.");
  // As datas e horas dos eventos do lote, no fuso da propriedade.
  const timeZone = await propertyTimeZone(batch.propertyId);

  // Transferências de sessão de manejo ainda não consolidada ficam de fora.
  const pendingWhere = {
    confirmedAt: null,
    cancelledAt: null,
    managementSessionId: null,
  };

  const [
    animals,
    movements,
    incomingPending,
    outgoingPending,
    confirmedIncoming,
    confirmedOutgoing,
    purchases,
    stocking,
  ] = await Promise.all([
    prisma.animal.findMany({
      where: { currentBatchId: id, status: "ACTIVE" },
      include: {
        breed: { select: { name: true } },
        animalWeighings: {
          where: { cancelledAt: null, ...effectiveWeighing },
        },
        animalBatchHistories: {
          where: { batchId: id, exitedAt: null },
          select: { enteredAt: true },
          take: 1,
        },
      },
    }),
    prisma.animalBatchHistory.findMany({
      where: { batchId: id },
      orderBy: { enteredAt: "desc" },
      include: {
        animal: {
          select: {
            id: true,
            code: true,
            currentTag: true,
            currentRfid: true,
          },
        },
      },
    }),
    prisma.animalBatchTransfer.findMany({
      where: { ...pendingWhere, destinationBatchId: id },
      orderBy: { transferredAt: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    // Planos para outros lotes que incluem animais que hoje estão neste lote.
    prisma.animalBatchTransfer.findMany({
      where: {
        ...pendingWhere,
        destinationBatchId: { not: id },
        items: { some: { animal: { currentBatchId: id } } },
      },
      orderBy: { transferredAt: "asc" },
      include: {
        destinationBatch: { select: { id: true, name: true } },
        items: {
          where: { animal: { currentBatchId: id } },
          select: { id: true },
        },
      },
    }),
    prisma.animalBatchTransfer.findMany({
      where: { destinationBatchId: id, confirmedAt: { not: null } },
      include: { _count: { select: { items: true } } },
    }),
    prisma.animalBatchTransfer.findMany({
      where: {
        confirmedAt: { not: null },
        items: { some: { originBatchId: id } },
      },
      include: {
        destinationBatch: { select: { name: true } },
        items: { where: { originBatchId: id }, select: { id: true } },
      },
    }),
    prisma.purchaseReception.findMany({
      where: { entryBatchId: id, purchaseEvent: { cancelledAt: null } },
      select: {
        purchaseEvent: {
          select: {
            id: true,
            purchaseDate: true,
            confirmedAt: true,
            seller: { select: { id: true, name: true } },
          },
        },
        _count: { select: { purchasedAnimals: true } },
      },
    }),
    stockingPreview({ batchId: id }),
  ]);

  const weighingsByAnimal = animals.map((a) => ({
    weighings: sortWeighings(
      a.animalWeighings.map((w) => toWeighingDto(w, () => timeZone)),
    ).map((w) => ({
      date: w.date,
      weightKg: w.weightKg,
    })),
  }));

  const animalDtos = animals.map((a, i) => {
    const { weighings } = weighingsByAnimal[i];
    return {
      id: a.id,
      code: a.code,
      earTag: a.currentTag,
      rfid: a.currentRfid,
      name: a.name,
      sex: a.sex,
      neutered: a.neutered,
      birthDate: fromDbDate(a.birthDate),
      breedName: a.breed?.name ?? null,
      currentWeightKg: a.currentWeight?.toNumber() ?? null,
      lastWeighingDate: weighings.at(-1)?.date ?? null,
      adgKgPerDay: averageDailyGain(weighings),
      enteredAt: a.animalBatchHistories[0]
        ? instantToZonedIso(a.animalBatchHistories[0].enteredAt, timeZone)
        : null,
    };
  });

  const currentArea = batch.batchAreaHistories.find((h) => !h.exitedAt);

  return {
    id: batch.id,
    name: batch.name,
    notes: batch.notes,
    closedAt: batch.closedAt?.toISOString() ?? null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    property: batch.property,
    saleGoal: batch.saleGoal
      ? {
          targetDate: fromDbDate(batch.saleGoal.targetDate),
          targetWeightKg: batch.saleGoal.targetWeight?.toNumber() ?? null,
        }
      : null,
    currentArea: currentArea
      ? {
          id: currentArea.area.id,
          name: currentArea.area.name,
          hectares: currentArea.area.hectares.toNumber(),
          stockingRate: currentArea.area.stockingRate.toNumber(),
          enteredAt: instantToZonedIso(currentArea.enteredAt, timeZone),
        }
      : null,
    areaHistory: batch.batchAreaHistories.map((h) => ({
      id: h.id,
      area: { id: h.area.id, name: h.area.name },
      enteredAt: instantToZonedIso(h.enteredAt, timeZone),
      exitedAt: h.exitedAt ? instantToZonedIso(h.exitedAt, timeZone) : null,
      notes: h.notes,
    })),
    stocking: stocking
      ? {
          capacityUa: stocking.capacityUa,
          currentUa: stocking.current.ua,
          estimatedCount: stocking.current.estimatedCount,
        }
      : null,
    animals: animalDtos,
    weightSeries: weightSeries(
      weighingsByAnimal,
      dayInZone(batch.createdAt, timeZone),
    ),
    movements: movements.map((m) => ({
      id: m.id,
      animal: {
        id: m.animal.id,
        code: m.animal.code,
        earTag: m.animal.currentTag,
        rfid: m.animal.currentRfid,
      },
      enteredAt: instantToZonedIso(m.enteredAt, timeZone),
      exitedAt: m.exitedAt ? instantToZonedIso(m.exitedAt, timeZone) : null,
      notes: m.notes,
    })),
    pendingTransfers: {
      incoming: incomingPending.map((t) => ({
        id: t.id,
        transferredAt: instantToZonedIso(t.transferredAt, timeZone),
        animalCount: t._count.items,
        notes: t.notes,
      })),
      outgoing: outgoingPending.map((t) => ({
        id: t.id,
        transferredAt: instantToZonedIso(t.transferredAt, timeZone),
        destinationBatch: t.destinationBatch,
        animalCount: t.items.length,
        notes: t.notes,
      })),
    },
    confirmedTransfers: [
      ...confirmedIncoming.map((t) => ({
        id: t.id,
        direction: "in" as const,
        date: instantToZonedIso(t.confirmedAt!, timeZone),
        animalCount: t._count.items,
        otherBatchName: null,
      })),
      ...confirmedOutgoing.map((t) => ({
        id: t.id,
        direction: "out" as const,
        date: instantToZonedIso(t.confirmedAt!, timeZone),
        animalCount: t.items.length,
        otherBatchName: t.destinationBatch.name,
      })),
    ],
    purchases: groupPurchases(purchases),
  };
}
