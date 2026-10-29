import { instantToZonedIso, type AnimalFullDetails } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";
import {
  effectiveHealthItem,
  effectiveNeutering,
  effectiveRfidTagging,
  effectiveTagging,
  effectiveWeighing,
} from "../../management-session/effective.public";
import {
  asTimeZone,
  timeZoneAt,
  type ZoneOf,
  toZonedIso,
} from "../../property/time-zone.public";
import { sortWeighings, toWeighingDto } from "../weighing/history.public";

// Pelo instante: as datas dos eventos podem vir com deslocamentos diferentes.
const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
  Date.parse(b.date) - Date.parse(a.date);

// Ficha completa do animal: históricos de pesagem, identificação, castração, sanidade,
// lotes e propriedades, e a compra de origem.
export async function getAnimalDetails(id: string): Promise<AnimalFullDetails> {
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      breed: { select: { name: true } },
      currentBatch: { select: { id: true, name: true } },
      currentProperty: { select: { id: true, name: true, timeZone: true } },
      animalWeighings: {
        where: { cancelledAt: null, ...effectiveWeighing },
        include: { management: { select: { managementSessionId: true } } },
      },
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
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              property: { select: { timeZone: true } },
            },
          },
        },
      },
      animalPropertyHistories: {
        include: {
          property: { select: { id: true, name: true, timeZone: true } },
        },
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
              managementSessionId: true,
            },
          },
        },
      },
    },
  });

  if (!animal) throw new NotFoundError("Animal não encontrado.");

  // Cada evento vai no fuso da propriedade onde aconteceu (pelo histórico de propriedades).
  const stays = animal.animalPropertyHistories;
  const currentZone = asTimeZone(animal.currentProperty.timeZone);
  const zoneOf: ZoneOf = (instant) => timeZoneAt(stays, instant, currentZone);
  const zoned = (instant: Date) => instantToZonedIso(instant, zoneOf(instant));

  const weighings = sortWeighings(
    animal.animalWeighings.map((w) => toWeighingDto(w, zoneOf)),
  );

  const tagHistory = animal.animalTaggings
    .map((t) => ({
      id: t.id,
      date: zoned(t.identifiedAt),
      value: t.tag,
      notes: t.notes,
    }))
    .sort(byDateDesc);

  const rfidHistory = animal.animalRfidTaggings
    .map((r) => ({
      id: r.id,
      date: zoned(r.identifiedAt),
      value: r.rfid,
      notes: r.notes,
    }))
    .sort(byDateDesc);

  const neutering = animal.animalNeuterings
    .map((n) => ({
      id: n.id,
      date: zoned(n.neuteredAt),
      techniqueName: n.technique?.name ?? null,
      notes: n.notes,
      correctedAt: n.correctedAt
        ? toZonedIso(n.correctedAt, zoneOf(n.correctedAt))
        : null,
    }))
    .sort(byDateDesc);

  const health = animal.healthManagementItems
    .map((h) => ({
      id: h.id,
      date: zoned(h.appliedAt),
      typeName: h.management.type.name,
      title: h.management.title,
      veterinarianName: h.management.veterinarian?.name ?? null,
      withdrawalEndDate: fromDbDate(h.management.withdrawalEndDate),
      nextDueDate: fromDbDate(h.management.nextDueDate),
      doseMl: h.doseMl?.toNumber() ?? null,
      notes: h.notes,
    }))
    .sort(byDateDesc);

  // Entrada e saída de um lote no fuso da propriedade do lote; de uma propriedade, no dela.
  const batchHistory = animal.animalBatchHistories
    .map((b) => {
      const inZone = (instant: Date) =>
        instantToZonedIso(
          instant,
          b.batch ? asTimeZone(b.batch.property.timeZone) : zoneOf(instant),
        );
      return {
        id: b.id,
        date: inZone(b.enteredAt),
        batchId: b.batch?.id ?? null,
        batchName: b.batch?.name ?? null,
        enteredAt: inZone(b.enteredAt),
        exitedAt: b.exitedAt ? inZone(b.exitedAt) : null,
        notes: b.notes,
      };
    })
    .sort(byDateDesc);

  const propertyHistory = animal.animalPropertyHistories
    .map((p) => {
      const timeZone = asTimeZone(p.property.timeZone);
      return {
        id: p.id,
        date: instantToZonedIso(p.enteredAt, timeZone),
        propertyId: p.property.id,
        propertyName: p.property.name,
        enteredAt: instantToZonedIso(p.enteredAt, timeZone),
        exitedAt: toZonedIso(p.exitedAt, timeZone),
        notes: p.notes,
      };
    })
    .sort(byDateDesc);

  const purchased = animal.purchasedAnimals.find(
    (p) => !p.category.event.cancelledAt,
  );
  const purchase = purchased
    ? (() => {
        const { category } = purchased;
        const { event } = category;
        const unitPrice = category.unitPrice?.toNumber() ?? null;
        // Peso de entrada = pesagem feita na sessão da recepção, se houver.
        const entryWeighing = animal.animalWeighings.find(
          (w) =>
            w.management?.managementSessionId ===
            purchased.reception.managementSessionId,
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
          weightKg: entryWeighing?.weight.toNumber() ?? null,
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
    birthDate: fromDbDate(animal.birthDate),
    birthDateEstimated: animal.birthDateEstimated,
    breedName: animal.breed?.name ?? null,
    origin: animal.origin,
    status: animal.status,
    neutered: animal.neutered,
    currentBatch: animal.currentBatch,
    currentProperty: {
      id: animal.currentProperty.id,
      name: animal.currentProperty.name,
    },
    currentWeightKg: animal.currentWeight?.toNumber() ?? null,
    createdAt: toZonedIso(animal.createdAt, currentZone),
    updatedAt: toZonedIso(animal.updatedAt, currentZone),
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
