import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getOrAssignCurrentProperty } from "@/server/current-property/queries";
import { categoryLabel } from "./reception";
import {
  purchaseApiSchema,
  purchaseQuerySchema,
  type PurchaseQueryData,
} from "./schemas";
import {
  errorResponse,
  categoryValue,
  PurchaseError,
  purchaseStatus,
  validationErrors,
} from "./shared";

function buildWhere(query: PurchaseQueryData, propertyId: string) {
  const where: Prisma.PurchaseEventWhereInput = {
    destinationPropertyId: propertyId,
  };

  const status = query.status ?? "open";
  if (status === "open") {
    Object.assign(where, { confirmedAt: null, cancelledAt: null });
  } else if (status === "confirmed") {
    Object.assign(where, { confirmedAt: { not: null }, cancelledAt: null });
  } else if (status === "cancelled") {
    where.cancelledAt = { not: null };
  } else {
    where.cancelledAt = null;
  }

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    where.OR = [
      { title: contains },
      { seller: { name: contains } },
      { notes: contains },
      { receptions: { some: { gtaNumber: contains } } },
      { receptions: { some: { invoiceNumber: contains } } },
    ];
  }

  return where;
}

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = purchaseQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const propertyId =
      query.data.propertyId ??
      (await getOrAssignCurrentProperty(session.user.id))?.id;
    if (!propertyId) {
      return NextResponse.json({ data: [], total: 0, pageCount: 0 });
    }

    const where = buildWhere(query.data, propertyId);
    const [events, total] = await Promise.all([
      prisma.purchaseEvent.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true } },
          categories: {
            include: {
              breed: { select: { name: true } },
              _count: { select: { animals: true } },
            },
          },
          _count: { select: { purchasedAnimals: true, receptions: true } },
        },
        orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
        skip: query.data.page * query.data.pageSize,
        take: query.data.pageSize,
      }),
      prisma.purchaseEvent.count({ where }),
    ]);

    return NextResponse.json({
      data: events.map((e) => {
        // Por cabeça: estimado sobre os esperados; consolidada, sobre os recebidos.
        const values = e.categories.map((c) =>
          categoryValue(
            c,
            e.confirmedAt ? c._count.animals : c.expectedQuantity,
          ),
        );
        return {
          id: e.id,
          title: e.title,
          purchaseDate: e.purchaseDate.toLocaleDateString("en-CA"),
          seller: e.seller,
          categories: e.categories.map(
            (c) => `${c.expectedQuantity} ${categoryLabel(c)}`,
          ),
          expectedQuantity: e.categories.reduce(
            (s, c) => s + c.expectedQuantity,
            0,
          ),
          receivedQuantity: e._count.purchasedAnimals,
          receptionCount: e._count.receptions,
          // Soma só quando todas as categorias têm valor.
          value: values.every((v) => v != null)
            ? values.reduce((s, v) => s + v!, 0)
            : null,
          status: purchaseStatus(e),
          paid: e.paidAt != null,
        };
      }),
      total,
      page: query.data.page,
      pageSize: query.data.pageSize,
      pageCount: Math.ceil(total / query.data.pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

// Registra a negociação: título, vendedor e as categorias negociadas (com preços). Nenhum animal
// existe ainda; eles são criados nas recepções.
export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const validation = purchaseApiSchema.safeParse(await request.json());
    if (!validation.success) return validationErrors(validation.error);
    const data = validation.data;

    const propertyId =
      data.propertyId ??
      (await getOrAssignCurrentProperty(session.user.id))?.id;
    if (!propertyId) {
      throw new PurchaseError("Nenhuma propriedade selecionada.");
    }

    const seller = await prisma.person.findFirst({
      where: { id: data.sellerId, deactivatedAt: null },
      select: { id: true },
    });
    if (!seller) {
      throw new PurchaseError("Vendedor inválido.", 400, "sellerId");
    }

    const event = await prisma.purchaseEvent.create({
      data: {
        title: data.title,
        purchaseDate: data.purchaseDate,
        notes: data.notes,
        sellerId: data.sellerId,
        destinationPropertyId: propertyId,
        categories: {
          create: data.categories.map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = c;
            return rest;
          }),
        },
      },
    });

    return NextResponse.json(
      { success: true, data: { id: event.id } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
