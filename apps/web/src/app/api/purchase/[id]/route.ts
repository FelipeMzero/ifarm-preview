import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { sessionStatus } from "@/lib/management-steps";
import { arrivalWeightsByCategory } from "../costs";
import { categoryLabel } from "../reception";
import { purchaseApiSchema, type PurchaseCategoryApiData } from "../schemas";
import {
  categoryValue,
  errorResponse,
  PurchaseError,
  purchaseStatus,
  validationErrors,
} from "../shared";

type Params = { params: Promise<{ id: string }> };

const num = (d: { toNumber(): number } | null) => d?.toNumber() ?? null;
const day = (d: Date | null) => d?.toLocaleDateString("en-CA") ?? null;

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  const { id } = await params;

  try {
    const event = await prisma.purchaseEvent.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true } },
        destinationProperty: { select: { id: true, name: true } },
        categories: {
          orderBy: { id: "asc" },
          include: {
            breed: { select: { id: true, name: true } },
            animals: { select: { cost: true } },
          },
        },
        receptions: {
          orderBy: { createdAt: "asc" },
          include: {
            entryBatch: { select: { id: true, name: true } },
            managementSession: true,
            _count: { select: { purchasedAnimals: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Compra não encontrada." },
        { status: 404 },
      );
    }

    const arrival = await arrivalWeightsByCategory(prisma, id);

    const categories = event.categories.map((c) => {
      const costs = c.animals.map((a) => num(a.cost));
      return {
        id: c.id,
        label: categoryLabel(c),
        sex: c.sex,
        minAgeMonths: c.minAgeMonths,
        maxAgeMonths: c.maxAgeMonths,
        breed: c.breed,
        expectedQuantity: c.expectedQuantity,
        pricingType: c.pricingType,
        unitPrice: num(c.unitPrice),
        totalPrice: num(c.totalPrice),
        invoicedWeight: num(c.invoicedWeight),
        shrinkPercent: num(c.shrinkPercent),
        costSplit: c.costSplit,
        notes: c.notes,
        receivedQuantity: c.animals.length,
        // Por cabeça: sobre os esperados enquanto em andamento; depois, os recebidos.
        estimatedValue: categoryValue(
          c,
          event.confirmedAt ? c.animals.length : c.expectedQuantity,
        ),
        // Soma do peso de chegada dos recebidos (sugestão do peso por arroba).
        arrivalWeight: arrival.get(c.id) ?? {
          totalKg: 0,
          weighed: 0,
          received: 0,
        },
        // Soma dos custos rateados (só existe com a compra consolidada).
        costTotal:
          costs.length && costs.every((v) => v != null)
            ? costs.reduce((s, v) => s + v!, 0)
            : null,
      };
    });

    return NextResponse.json({
      id: event.id,
      title: event.title,
      status: purchaseStatus(event),
      purchaseDate: day(event.purchaseDate),
      notes: event.notes ?? "",
      seller: event.seller,
      destinationProperty: event.destinationProperty,
      paidAt: day(event.paidAt),
      paymentReference: event.paymentReference,
      confirmedAt: event.confirmedAt?.toISOString() ?? null,
      cancelledAt: event.cancelledAt?.toISOString() ?? null,
      updatedAt: event.updatedAt.toISOString(),
      categories,
      receptions: event.receptions.map((r) => ({
        id: r.id,
        sessionId: r.managementSessionId,
        title: r.managementSession.title,
        status: sessionStatus(r.managementSession),
        scheduledDate: day(r.managementSession.scheduledDate),
        managementDate: day(r.managementSession.managementDate),
        entryBatch: r.entryBatch,
        gtaNumber: r.gtaNumber,
        invoiceNumber: r.invoiceNumber,
        animalCount: r._count.purchasedAnimals,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

// Campos que definem quanto se paga: bloqueados depois do pagamento.
const VALUE_FIELDS = [
  "pricingType",
  "unitPrice",
  "totalPrice",
  "invoicedWeight",
  "shrinkPercent",
] as const;

function sameValue(
  saved: Record<(typeof VALUE_FIELDS)[number], unknown>,
  next: PurchaseCategoryApiData,
) {
  return VALUE_FIELDS.every((field) => {
    const a = saved[field];
    const b = next[field];
    if (field === "pricingType") return a === b;
    const n = (v: unknown) =>
      v == null ? null : Number((v as { toString(): string }).toString());
    return n(a) === n(b);
  });
}

// Altera a negociação enquanto a compra está em andamento. Categorias com animais
// recebidos não podem ser removidas. Depois do pagamento, o que define o valor (vendedor,
// conjunto de categorias e seus preços/pesos) fica bloqueado.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = purchaseApiSchema.safeParse(await request.json());
    if (!validation.success) return validationErrors(validation.error);
    const data = validation.data;

    await prisma.$transaction(async (tx) => {
      const event = await tx.purchaseEvent.findUnique({
        where: { id },
        include: {
          categories: {
            include: { _count: { select: { animals: true } } },
          },
        },
      });
      if (!event) throw new PurchaseError("Compra não encontrada.", 404);
      if (event.confirmedAt || event.cancelledAt) {
        throw new PurchaseError(
          "Somente compras em andamento podem ser alteradas.",
          409,
        );
      }

      const keptIds = new Set(
        data.categories.map((c) => c.id).filter((v) => v != null),
      );
      const removed = event.categories.filter((c) => !keptIds.has(c.id));
      const existingIds = new Set(event.categories.map((c) => c.id));
      const added = data.categories.filter(
        (c) => c.id == null || !existingIds.has(c.id),
      );

      if (event.paidAt) {
        const changedValue = data.categories.some((c) => {
          const saved = event.categories.find((s) => s.id === c.id);
          return saved && !sameValue(saved, c);
        });
        if (
          data.sellerId !== event.sellerId ||
          removed.length ||
          added.length ||
          changedValue
        ) {
          throw new PurchaseError(
            "A compra já foi paga: vendedor, categorias e valores não podem mudar. Desfaça o pagamento para corrigir.",
            409,
          );
        }
      }

      const seller = await tx.person.findFirst({
        where: { id: data.sellerId, deactivatedAt: null },
        select: { id: true },
      });
      if (!seller && data.sellerId !== event.sellerId) {
        throw new PurchaseError("Vendedor inválido.", 400, "sellerId");
      }

      const withAnimals = removed.filter((c) => c._count.animals > 0);
      if (withAnimals.length) {
        throw new PurchaseError(
          `Não é possível remover categorias com animais recebidos (${withAnimals
            .map((c) => `${c._count.animals} animal(is)`)
            .join(", ")}).`,
          409,
          "categories",
        );
      }
      if (removed.length) {
        await tx.purchaseCategory.deleteMany({
          where: { id: { in: removed.map((c) => c.id) } },
        });
      }

      for (const { id: categoryId, ...category } of data.categories) {
        if (categoryId != null && existingIds.has(categoryId)) {
          await tx.purchaseCategory.update({
            where: { id: categoryId },
            data: category,
          });
        } else {
          await tx.purchaseCategory.create({
            data: { ...category, eventId: id },
          });
        }
      }

      await tx.purchaseEvent.update({
        where: { id },
        data: {
          title: data.title,
          purchaseDate: data.purchaseDate,
          notes: data.notes,
          sellerId: data.sellerId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
