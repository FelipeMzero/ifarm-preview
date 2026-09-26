import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  batchTransferApiSchema,
  batchTransferQuerySchema,
  type BatchTransferQueryData,
} from "@/app/api/schemas";
import { getOrAssignCurrentProperty } from "../user/current-property/currentProperty";
import { transferStatus, validateTransferPlan } from "./shared";

function buildWhere(query: BatchTransferQueryData, propertyId: string) {
  const where: Record<string, unknown> = {
    propertyId,
    // Transferências de sessão de manejo ainda não consolidada são geridas pela sessão.
    AND: [
      { OR: [{ managementSessionId: null }, { confirmedAt: { not: null } }] },
    ],
  };

  if (query.status === "pending") {
    where.confirmedAt = null;
    where.cancelledAt = null;
  } else if (query.status === "confirmed") {
    where.confirmedAt = { not: null };
    where.cancelledAt = null;
  } else if (query.status === "cancelled") {
    where.cancelledAt = { not: null };
  }

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" };
    where.OR = [
      { destinationBatch: { name: contains } },
      { notes: contains },
      { items: { some: { originBatch: { name: contains } } } },
      { items: { some: { animal: { currentBatch: { name: contains } } } } },
    ];
  }

  return where;
}

// Confirmadas usam o lote registrado no item; as demais, o lote atual dos animais.
function originBatchNames(t: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  items: {
    originBatch: { name: string } | null;
    animal: { currentBatch: { name: string } | null };
  }[];
}) {
  const confirmed = transferStatus(t) === "confirmed";
  const names = t.items.map(
    (i) =>
      (confirmed ? i.originBatch?.name : i.animal.currentBatch?.name) ??
      "Sem lote",
  );
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = batchTransferQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );

    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    let propertyId = query.data.propertyId;
    if (!propertyId) {
      propertyId = (await getOrAssignCurrentProperty(session.user.id))?.id;
    }

    if (!propertyId) {
      return NextResponse.json({ data: [], total: 0, pageCount: 0 });
    }

    const where = buildWhere(query.data, propertyId);

    const [transfers, total] = await Promise.all([
      prisma.animalBatchTransfer.findMany({
        where,
        include: {
          destinationBatch: { select: { id: true, name: true } },
          items: {
            select: {
              originBatch: { select: { name: true } },
              animal: { select: { currentBatch: { select: { name: true } } } },
            },
          },
        },
        orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
        skip: query.data.page * query.data.pageSize,
        take: query.data.pageSize,
      }),
      prisma.animalBatchTransfer.count({ where }),
    ]);

    return NextResponse.json({
      data: transfers.map((t) => ({
        id: t.id,
        transferDate: t.transferDate.toISOString().slice(0, 10),
        notes: t.notes,
        originBatches: originBatchNames(t),
        destinationBatch: t.destinationBatch,
        animalCount: t.items.length,
        status: transferStatus(t),
        confirmedAt: t.confirmedAt?.toISOString() ?? null,
        cancelledAt: t.cancelledAt?.toISOString() ?? null,
        updatedAt: t.updatedAt.toISOString(),
      })),
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

export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const body = await request.json();
    const validation = batchTransferApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;

    let propertyId = data.propertyId;
    if (!propertyId) {
      propertyId = (await getOrAssignCurrentProperty(session.user.id))?.id;
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: "Nenhuma propriedade selecionada." },
        { status: 400 },
      );
    }

    const animalIds = [...new Set(data.animalIds)];
    const errors = await validateTransferPlan({
      propertyId,
      destinationBatchId: data.destinationBatchId,
      animalIds,
    });

    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const transfer = await prisma.animalBatchTransfer.create({
      data: {
        transferDate: data.transferDate,
        notes: data.notes,
        destinationBatchId: data.destinationBatchId,
        propertyId,
        items: {
          create: animalIds.map((animalId) => ({ animalId })),
        },
      },
    });

    return NextResponse.json(
      { success: true, data: { id: transfer.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
