import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { sortWeighings, toWeighingDto } from "../../weighings";
import {
  effectiveHealthItem,
  effectiveNeutering,
  effectiveRfidTagging,
  effectiveTagging,
  effectiveWeighing,
} from "../../../management-session/effective";

const toDateOnly = (d: Date | null | undefined) =>
  d ? d.toISOString().slice(0, 10) : null;

const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
  b.date.localeCompare(a.date);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        breed: { select: { name: true } },
        currentBatch: { select: { id: true, name: true } },
        currentProperty: { select: { id: true, name: true } },
        animalWeighings: { where: { cancelledAt: null, ...effectiveWeighing } },
        animalTaggings: { where: effectiveTagging },
        animalRfidTaggings: { where: effectiveRfidTagging },
        animalNeuterings: {
          where: { cancelledAt: null, ...effectiveNeutering },
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
        purchaseEventItems: {
          include: {
            event: {
              include: { seller: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json(
        { message: "Animal não encontrado." },
        { status: 404 },
      );
    }

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
        method: n.method,
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
        withdrawalUntil: toDateOnly(h.management.withdrawalUntil),
        nextDueDate: toDateOnly(h.management.nextDueDate),
        cost: h.cost?.toNumber() ?? null,
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

    const purchaseItem = animal.purchaseEventItems.find(
      (p) => !p.event.cancelledAt,
    );
    const purchase = purchaseItem
      ? {
          date: purchaseItem.event.purchaseDate.toISOString(),
          sellerId: purchaseItem.event.seller.id,
          sellerName: purchaseItem.event.seller.name,
          pricingType: purchaseItem.event.pricingType,
          pricePerArroba: purchaseItem.event.pricePerArroba?.toNumber() ?? null,
          totalPrice: purchaseItem.event.totalPrice?.toNumber() ?? null,
          cost: purchaseItem.cost?.toNumber() ?? null,
          weightKg: purchaseItem.weight?.toNumber() ?? null,
          gtaNumber: purchaseItem.event.gtaNumber,
          notes: purchaseItem.event.notes,
        }
      : null;

    return NextResponse.json({
      id: animal.id,
      code: animal.code,
      currentTag: animal.currentTag,
      currentRfid: animal.currentRfid,
      name: animal.name,
      sex: animal.sex,
      birthDate: toDateOnly(animal.birthDate),
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
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
