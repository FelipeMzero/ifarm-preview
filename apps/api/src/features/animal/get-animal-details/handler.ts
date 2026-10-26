import type { AnimalFullDetails } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "@ifarm/domain/db-dates";
import { NotFoundError } from "@ifarm/domain/errors";
import {
  effectiveHealthItem,
  effectiveNeutering,
  effectiveRfidTagging,
  effectiveTagging,
  effectiveWeighing,
} from "../../management-session/effective";
import { sortWeighings, toWeighingDto } from "../weighing/shared";

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
