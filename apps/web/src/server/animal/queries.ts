import "server-only";
import { z } from "zod";
import {
  AnimalOrigin,
  AnimalStatus,
  Sex,
  type AnimalDetail,
  type AnimalFullDetails,
  type AnimalListResult,
  type AnimalNeuteringRecord,
  type AnimalWeighing,
  type Commitment,
  type CommitmentExclusion,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import {
  effectiveHealthItem,
  effectiveNeutering,
  effectiveRfidTagging,
  effectiveTagging,
  effectiveWeighing,
} from "../management-session/effective";
import { findCommitments } from "./commitments";
import { neuteringInclude, toNeuteringDto } from "./neuterings";
import { sortWeighings, toWeighingDto } from "./weighings";
import { fromDbDate } from "@/server/db-dates";

export const animalQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(AnimalStatus).optional(),
  ),
  sex: z.preprocess((v) => (v === "" ? undefined : v), z.enum(Sex).optional()),
  // "none" = animais sem lote.
  batchId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.union([z.uuid(), z.literal("none")]).optional(),
  ),
  neutered: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["true", "false"]).optional(),
  ),
  // Faixa etária pela data de nascimento; "unknown" = sem data de nascimento.
  ageRange: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["upTo12", "12to24", "over24", "unknown"]).optional(),
  ),
  breedId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  origin: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(AnimalOrigin).optional(),
  ),
  excludeBatchId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.uuid().optional(),
  ),
  minWeight: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  maxWeight: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
});

export type AnimalQuery = z.infer<typeof animalQuerySchema>;

// Limites de data de nascimento para cada faixa etária (idade em meses completos).
function birthDateFilter(range: "upTo12" | "12to24" | "over24" | "unknown") {
  if (range === "unknown") return null;
  const monthsAgo = (months: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - months);
    return d;
  };
  if (range === "upTo12") return { gt: monthsAgo(12) };
  if (range === "12to24") return { gt: monthsAgo(24), lte: monthsAgo(12) };
  return { lte: monthsAgo(24) };
}

// Animais da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listAnimals(
  query: AnimalQuery,
  userId: string,
): Promise<AnimalListResult> {
  const {
    page,
    pageSize,
    search,
    status,
    sex,
    batchId,
    excludeBatchId,
    minWeight,
    maxWeight,
    neutered,
    ageRange,
    breedId,
    origin,
  } = query;

  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [], total: 0, pageCount: 0 };

  const codeMatch = search.match(/^#?(\d{1,9})$/);
  const searchCode = codeMatch ? Number(codeMatch[1]) : null;

  const where = {
    currentPropertyId: propertyId,
    ...(search
      ? {
          OR: [
            {
              currentTag: { contains: search, mode: "insensitive" as const },
            },
            {
              currentRfid: { contains: search, mode: "insensitive" as const },
            },
            { name: { contains: search, mode: "insensitive" as const } },
            ...(searchCode != null ? [{ code: searchCode }] : []),
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(sex ? { sex } : {}),
    ...(batchId ? { currentBatchId: batchId === "none" ? null : batchId } : {}),
    ...(neutered ? { neutered: neutered === "true" } : {}),
    ...(breedId ? { breedId } : {}),
    ...(origin ? { origin } : {}),
    ...(ageRange ? { birthDate: birthDateFilter(ageRange) } : {}),
    // "<>" no SQL descarta NULL, então os animais sem lote precisam ser incluídos à parte.
    ...(excludeBatchId
      ? {
          AND: [
            {
              OR: [
                { currentBatchId: null },
                { currentBatchId: { not: excludeBatchId } },
              ],
            },
          ],
        }
      : {}),
    ...(minWeight != null || maxWeight != null
      ? {
          currentWeight: {
            ...(minWeight != null ? { gte: minWeight } : {}),
            ...(maxWeight != null ? { lte: maxWeight } : {}),
          },
        }
      : {}),
  };

  const [animals, total] = await Promise.all([
    prisma.animal.findMany({
      where,
      include: { currentBatch: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.animal.count({ where }),
  ]);

  return {
    data: animals.map((a) => ({
      id: a.id,
      code: a.code,
      earTag: a.currentTag,
      rfid: a.currentRfid,
      name: a.name,
      sex: a.sex,
      birthDate: a.birthDate ? fromDbDate(a.birthDate) : null,
      origin: a.origin,
      status: a.status,
      currentWeightKg: a.currentWeight?.toNumber() ?? null,
      currentBatch: a.currentBatch,
      updatedAt: a.updatedAt.toISOString(),
    })) as AnimalListResult["data"],
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}

// Com recastração há mais de um registro: vale o mais recente.
function latestNeuteringDate(items: { neuteredAt: Date }[]): string | null {
  const dates = items.map((item) => item.neuteredAt.toISOString());
  return dates.sort().at(-1) ?? null;
}

// Animal para edição.
export async function getAnimal(id: string): Promise<AnimalDetail> {
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      breed: { select: { id: true, name: true } },
      currentBatch: { select: { id: true, name: true } },
      animalNeuterings: {
        where: { cancelledAt: null, ...effectiveNeutering },
        select: { neuteredAt: true },
      },
    },
  });
  if (!animal) throw new NotFoundError("Animal não encontrado.");

  return {
    id: animal.id,
    currentTag: animal.currentTag,
    currentRfid: animal.currentRfid,
    name: animal.name,
    sex: animal.sex,
    birthDate: animal.birthDate ? fromDbDate(animal.birthDate) : null,
    breedId: animal.breedId,
    breedName: animal.breed?.name ?? null,
    origin: animal.origin,
    status: animal.status,
    neutered: animal.neutered,
    neuteredAt: latestNeuteringDate(animal.animalNeuterings),
    currentBatchId: animal.currentBatchId,
    currentBatchName: animal.currentBatch?.name ?? null,
    currentPropertyId: animal.currentPropertyId,
    currentWeightKg: animal.currentWeight?.toNumber() ?? null,
    updatedAt: animal.updatedAt.toISOString(),
  };
}

const toDateOnly = (d: Date | null | undefined) => (d ? fromDbDate(d) : null);

const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
  b.date.localeCompare(a.date);

// Ficha completa do animal: históricos de pesagem, identificação, castração, sanidade,
// lotes e propriedades, e a compra de origem.
export async function getAnimalDetails(id: string): Promise<AnimalFullDetails> {
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      breed: { select: { name: true } },
      currentBatch: { select: { id: true, name: true } },
      currentProperty: { select: { id: true, name: true } },
      animalWeighings: { where: { cancelledAt: null, ...effectiveWeighing } },
      animalTaggings: { where: { cancelledAt: null, ...effectiveTagging } },
      animalRfidTaggings: {
        where: { cancelledAt: null, ...effectiveRfidTagging },
      },
      animalNeuterings: {
        where: { cancelledAt: null, ...effectiveNeutering },
        include: { technique: { select: { name: true } } },
      },
      healthManagementItems: {
        where: effectiveHealthItem,
        include: {
          management: {
            include: {
              type: { select: { name: true } },
              veterinarian: { select: { name: true } },
            },
          },
        },
      },
      animalBatchHistories: {
        include: { batch: { select: { id: true, name: true } } },
      },
      animalPropertyHistories: {
        include: { property: { select: { id: true, name: true } } },
      },
      purchasedAnimals: {
        include: {
          category: {
            include: {
              event: {
                include: { seller: { select: { id: true, name: true } } },
              },
            },
          },
          reception: {
            select: {
              gtaNumber: true,
              managementSession: { select: { performedAt: true } },
            },
          },
        },
      },
    },
  });

  if (!animal) throw new NotFoundError("Animal não encontrado.");

  const weighings = sortWeighings(animal.animalWeighings.map(toWeighingDto));

  const tagHistory = animal.animalTaggings
    .map((t) => ({
      id: t.id,
      date: t.identifiedAt.toISOString(),
      value: t.tag,
      notes: t.notes,
    }))
    .sort(byDateDesc);

  const rfidHistory = animal.animalRfidTaggings
    .map((r) => ({
      id: r.id,
      date: r.identifiedAt.toISOString(),
      value: r.rfid,
      notes: r.notes,
    }))
    .sort(byDateDesc);

  const neutering = animal.animalNeuterings
    .map((n) => ({
      id: n.id,
      date: n.neuteredAt.toISOString(),
      techniqueName: n.technique?.name ?? null,
      notes: n.notes,
      correctedAt: n.correctedAt?.toISOString() ?? null,
    }))
    .sort(byDateDesc);

  const health = animal.healthManagementItems
    .map((h) => ({
      id: h.id,
      date: h.management.performedAt.toISOString(),
      typeName: h.management.type.name,
      title: h.management.title,
      veterinarianName: h.management.veterinarian?.name ?? null,
      withdrawalEndDate: toDateOnly(h.management.withdrawalEndDate),
      nextDueDate: toDateOnly(h.management.nextDueDate),
      doseMl: h.doseMl?.toNumber() ?? null,
      notes: h.notes,
    }))
    .sort(byDateDesc);

  const batchHistory = animal.animalBatchHistories
    .map((b) => ({
      id: b.id,
      date: b.enteredAt.toISOString(),
      batchId: b.batch?.id ?? null,
      batchName: b.batch?.name ?? null,
      enteredAt: b.enteredAt.toISOString(),
      exitedAt: b.exitedAt?.toISOString() ?? null,
      notes: b.notes,
    }))
    .sort(byDateDesc);

  const propertyHistory = animal.animalPropertyHistories
    .map((p) => ({
      id: p.id,
      date: p.enteredAt.toISOString(),
      propertyId: p.property.id,
      propertyName: p.property.name,
      enteredAt: p.enteredAt.toISOString(),
      exitedAt: p.exitedAt?.toISOString() ?? null,
      notes: p.notes,
    }))
    .sort(byDateDesc);

  const purchased = animal.purchasedAnimals.find(
    (p) => !p.category.event.cancelledAt,
  );
  const purchase = purchased
    ? (() => {
        const { category } = purchased;
        const { event } = category;
        const unitPrice = category.unitPrice?.toNumber() ?? null;
        // Peso de entrada = pesagem feita no dia da recepção, se houver.
        const receptionDay = toDateOnly(
          purchased.reception.managementSession.performedAt,
        );
        const entryWeighing = weighings.find(
          (w) => w.date.slice(0, 10) === receptionDay,
        );
        return {
          date: fromDbDate(event.purchaseDate),
          sellerId: event.seller.id,
          sellerName: event.seller.name,
          pricingType: category.pricingType,
          pricePerArroba:
            category.pricingType === "PER_ARROBA" ? unitPrice : null,
          // O valor total é da categoria; só vale como valor do animal se ela tem um só.
          totalPrice:
            category.pricingType === "LUMP_SUM" &&
            category.expectedQuantity === 1
              ? (category.totalPrice?.toNumber() ?? null)
              : null,
          cost:
            purchased.cost?.toNumber() ??
            (category.pricingType === "PER_HEAD" ? unitPrice : null),
          weightKg: entryWeighing?.weightKg ?? null,
          // GTA da carga (recepção) em que o animal chegou.
          gtaNumber: purchased.reception.gtaNumber,
          notes: event.notes,
        };
      })()
    : null;

  return {
    id: animal.id,
    code: animal.code,
    currentTag: animal.currentTag,
    currentRfid: animal.currentRfid,
    name: animal.name,
    sex: animal.sex,
    birthDate: toDateOnly(animal.birthDate),
    birthDateEstimated: animal.birthDateEstimated,
    breedName: animal.breed?.name ?? null,
    origin: animal.origin,
    status: animal.status,
    neutered: animal.neutered,
    currentBatch: animal.currentBatch,
    currentProperty: animal.currentProperty,
    currentWeightKg: animal.currentWeight?.toNumber() ?? null,
    createdAt: animal.createdAt.toISOString(),
    updatedAt: animal.updatedAt.toISOString(),
    weighings,
    tagHistory,
    rfidHistory,
    neutering,
    health,
    batchHistory,
    propertyHistory,
    purchase,
  };
}

// Pesagens válidas, da mais antiga para a mais recente.
export async function listWeighings(
  animalId: string,
): Promise<AnimalWeighing[]> {
  const items = await prisma.animalWeighing.findMany({
    where: { animalId, cancelledAt: null, ...effectiveWeighing },
  });
  return sortWeighings(items.map(toWeighingDto));
}

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
export async function listNeuterings(
  animalId: string,
): Promise<AnimalNeuteringRecord[]> {
  const items = await prisma.animalNeutering.findMany({
    where: { animalId, cancelledAt: null, ...effectiveNeutering },
    include: neuteringInclude,
  });
  return items
    .map(toNeuteringDto)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

// Mesmo teto do "adicionar todos os filtrados" do seletor de animais.
const MAX_ANIMALS = 2000;

export const commitmentsQuerySchema = z.object({
  animalIds: z.array(z.uuid()).max(MAX_ANIMALS),
  sessionId: z.uuid().optional(),
  transferId: z.uuid().optional(),
});

// Compromissos em aberto de vários animais; `exclude` é a operação sendo editada, que não
// conta como conflito.
export async function listCommitments(
  animalIds: string[],
  exclude: CommitmentExclusion = {},
): Promise<Record<string, Commitment[]>> {
  const commitments = await prisma.$transaction((tx) =>
    findCommitments(tx, animalIds, exclude),
  );
  return Object.fromEntries(commitments);
}

// Operações abertas que já contam com o animal, para as telas avisarem antes de salvar.
export async function getAnimalCommitments(id: string): Promise<Commitment[]> {
  const commitments = await prisma.$transaction((tx) =>
    findCommitments(tx, [id]),
  );
  return commitments.get(id) ?? [];
}
