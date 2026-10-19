import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { sortWeighings, toWeighingDto } from "../../../animal/weighings";
import { stockingPreview } from "@/server/stocking/queries";
import { effectiveWeighing } from "../../../management-session/effective";

const DAY_MS = 24 * 60 * 60 * 1000;
// Janela usada no GMD de cada animal: reflete o ritmo recente, não a vida toda.
const ADG_WINDOW_DAYS = 180;
// Intervalo mínimo entre a primeira e a última pesagem da janela para o GMD valer.
const ADG_MIN_SPAN_DAYS = 14;

type Weighing = { date: string; weightKg: number };

// GMD (kg/dia) pelas pesagens da janela recente; null sem dados suficientes.
function averageDailyGain(weighings: Weighing[]): number | null {
  const last = weighings.at(-1);
  if (!last) return null;
  const windowStart = new Date(last.date).getTime() - ADG_WINDOW_DAYS * DAY_MS;
  const recent = weighings.filter(
    (w) => new Date(w.date).getTime() >= windowStart,
  );
  const first = recent[0];
  if (!first || recent.length < 2) return null;
  const days =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / DAY_MS;
  if (days < ADG_MIN_SPAN_DAYS) return null;
  return (last.weightKg - first.weightKg) / days;
}

const dayKey = (iso: string) => iso.slice(0, 10);

// Peso médio do rebanho atual ao longo do tempo: em cada dia com pesagem, a média
// do último peso conhecido de cada animal até aquele dia. Começa na criação do lote
// (pesos anteriores entram como ponto de partida).
function weightSeries(
  animals: { weighings: Weighing[] }[],
  since: Date,
): { date: string; avgWeightKg: number; animalCount: number }[] {
  const sinceKey = dayKey(since.toISOString());
  const days = new Set<string>();
  let hasEarlier = false;
  for (const a of animals) {
    for (const w of a.weighings) {
      const key = dayKey(w.date);
      if (key >= sinceKey) days.add(key);
      else hasEarlier = true;
    }
  }
  if (hasEarlier) days.add(sinceKey);

  return [...days].sort().flatMap((day) => {
    const weights = animals
      .map((a) => a.weighings.filter((w) => dayKey(w.date) <= day).at(-1))
      .filter((w): w is Weighing => !!w)
      .map((w) => w.weightKg);
    if (!weights.length) return [];
    return [
      {
        date: day,
        avgWeightKg: weights.reduce((s, w) => s + w, 0) / weights.length,
        animalCount: weights.length,
      },
    ];
  });
}

type ReceptionInBatch = {
  purchaseEvent: {
    id: string;
    purchaseDate: Date;
    confirmedAt: Date | null;
    seller: { id: string; name: string };
  };
  _count: { purchasedAnimals: number };
};

// Compras que tiveram este lote como lote de entrada, somando as recepções (viagens)
// de cada compra.
function groupPurchases(receptions: ReceptionInBatch[]) {
  const byEvent = new Map<
    string,
    ReceptionInBatch["purchaseEvent"] & { animalCount: number }
  >();
  for (const r of receptions) {
    const current = byEvent.get(r.purchaseEvent.id);
    byEvent.set(r.purchaseEvent.id, {
      ...r.purchaseEvent,
      animalCount: (current?.animalCount ?? 0) + r._count.purchasedAnimals,
    });
  }
  return [...byEvent.values()]
    .filter((e) => e.animalCount > 0)
    .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
    .map((e) => ({
      id: e.id,
      date: e.purchaseDate.toISOString(),
      seller: e.seller,
      animalCount: e.animalCount,
      confirmed: e.confirmedAt != null,
    }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
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

    if (!batch) {
      return NextResponse.json(
        { message: "Lote não encontrado." },
        { status: 404 },
      );
    }

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
        orderBy: { transferDate: "asc" },
        include: { _count: { select: { items: true } } },
      }),
      // Planos para outros lotes que incluem animais que hoje estão neste lote.
      prisma.animalBatchTransfer.findMany({
        where: {
          ...pendingWhere,
          destinationBatchId: { not: id },
          items: { some: { animal: { currentBatchId: id } } },
        },
        orderBy: { transferDate: "asc" },
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
      weighings: sortWeighings(a.animalWeighings.map(toWeighingDto)).map(
        (w) => ({ date: w.date, weightKg: w.weightKg }),
      ),
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
        birthDate: a.birthDate?.toISOString().slice(0, 10) ?? null,
        breedName: a.breed?.name ?? null,
        currentWeightKg: a.currentWeight?.toNumber() ?? null,
        lastWeighingDate: weighings.at(-1)?.date ?? null,
        adgKgPerDay: averageDailyGain(weighings),
        enteredAt: a.animalBatchHistories[0]?.enteredAt.toISOString() ?? null,
      };
    });

    const currentArea = batch.batchAreaHistories.find((h) => !h.exitedAt);

    return NextResponse.json({
      id: batch.id,
      name: batch.name,
      notes: batch.notes,
      closedAt: batch.closedAt?.toISOString() ?? null,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      property: batch.property,
      saleGoal: batch.saleGoal
        ? {
            targetDate:
              batch.saleGoal.targetDate?.toISOString().slice(0, 10) ?? null,
            targetWeightKg: batch.saleGoal.targetWeight?.toNumber() ?? null,
          }
        : null,
      currentArea: currentArea
        ? {
            id: currentArea.area.id,
            name: currentArea.area.name,
            hectares: currentArea.area.hectares.toNumber(),
            stockingRate: currentArea.area.stockingRate.toNumber(),
            enteredAt: currentArea.enteredAt.toISOString(),
          }
        : null,
      areaHistory: batch.batchAreaHistories.map((h) => ({
        id: h.id,
        area: { id: h.area.id, name: h.area.name },
        enteredAt: h.enteredAt.toISOString(),
        exitedAt: h.exitedAt?.toISOString() ?? null,
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
      weightSeries: weightSeries(weighingsByAnimal, batch.createdAt),
      movements: movements.map((m) => ({
        id: m.id,
        animal: {
          id: m.animal.id,
          code: m.animal.code,
          earTag: m.animal.currentTag,
          rfid: m.animal.currentRfid,
        },
        enteredAt: m.enteredAt.toISOString(),
        exitedAt: m.exitedAt?.toISOString() ?? null,
        notes: m.notes,
      })),
      pendingTransfers: {
        incoming: incomingPending.map((t) => ({
          id: t.id,
          transferDate: t.transferDate.toISOString().slice(0, 10),
          animalCount: t._count.items,
          notes: t.notes,
        })),
        outgoing: outgoingPending.map((t) => ({
          id: t.id,
          transferDate: t.transferDate.toISOString().slice(0, 10),
          destinationBatch: t.destinationBatch,
          animalCount: t.items.length,
          notes: t.notes,
        })),
      },
      confirmedTransfers: [
        ...confirmedIncoming.map((t) => ({
          id: t.id,
          direction: "in" as const,
          date: t.confirmedAt!.toISOString(),
          animalCount: t._count.items,
          otherBatchName: null,
        })),
        ...confirmedOutgoing.map((t) => ({
          id: t.id,
          direction: "out" as const,
          date: t.confirmedAt!.toISOString(),
          animalCount: t.items.length,
          otherBatchName: t.destinationBatch.name,
        })),
      ],
      purchases: groupPurchases(purchases),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
