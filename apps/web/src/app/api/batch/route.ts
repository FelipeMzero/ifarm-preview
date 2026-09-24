import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  batchCreateApiSchema,
  batchQuerySchema,
  type BatchQueryData,
} from "@/app/api/schemas";
import { uniqueConstraintErrors } from "@/app/api/dbErrors";
import { getOrAssignCurrentProperty } from "../user/current-property/currentProperty";

function buildWhere(query: BatchQueryData) {
  const where: Record<string, unknown> = {
    propertyId: query.propertyId,
  };

  if (query.status === "active") {
    where.closedAt = null;
  } else if (query.status === "inactive") {
    where.closedAt = { not: null };
  }

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  return where;
}

export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = batchQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    let propertyId = query.data.propertyId;
    if (!propertyId) {
      const currentProperty = await getOrAssignCurrentProperty(
        (await requireSession(RESOURCE_ACCESS.lotes)).session?.user.id ?? "",
      );
      propertyId = currentProperty?.id;
    }

    if (!propertyId) {
      return NextResponse.json({ data: [] });
    }

    const where = { ...buildWhere(query.data), propertyId };

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          saleGoal: true,
          batchAreaHistories: {
            where: { exitedAt: null },
            take: 1,
            orderBy: { enteredAt: "desc" },
            include: { area: { select: { id: true, name: true } } },
          },
          _count: {
            select: {
              animals: {
                where: { status: { in: ["ACTIVE"] } },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: query.data.page * query.data.pageSize,
        take: query.data.pageSize,
      }),
      prisma.batch.count({ where }),
    ]);

    const batchIds = batches.map((b) => b.id);
    const weightAgg = await prisma.animal.groupBy({
      by: ["currentBatchId"],
      where: { currentBatchId: { in: batchIds } },
      _avg: { currentWeight: true },
    });
    const avgByBatch = new Map(
      weightAgg.map((w) => [w.currentBatchId, w._avg.currentWeight]),
    );

    return NextResponse.json({
      data: batches.map((b) => ({
        id: b.id,
        name: b.name,
        notes: b.notes,
        hasMeta: Boolean(b.saleGoal),
        targetDate: b.saleGoal?.targetDate?.toISOString().slice(0, 10) ?? null,
        targetWeight: b.saleGoal?.targetWeight?.toNumber() ?? null,
        area: b.batchAreaHistories[0]?.area ?? null,
        animalCount: b._count.animals,
        avgWeightKg: avgByBatch.get(b.id)?.toNumber() ?? null,
        closedAt: b.closedAt?.toISOString() ?? null,
        updatedAt: b.updatedAt.toISOString(),
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
    const validation = batchCreateApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { name, notes, hasMeta, targetDate, targetWeight, areaId } =
      validation.data;
    let propertyId = validation.data.propertyId;

    if (!propertyId) {
      propertyId =
        (await getOrAssignCurrentProperty(session.user.id))?.id ?? "";
    }

    const area = await prisma.area.findFirst({
      where: { id: areaId, propertyId, closedAt: null },
      select: { id: true },
    });

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            areaId: "Área inválida ou inativa para a propriedade selecionada.",
          },
        },
        { status: 400 },
      );
    }

    const occupied = await prisma.batchAreaHistory.findFirst({
      where: {
        areaId,
        exitedAt: null,
        batch: {
          closedAt: null,
        },
      },
      select: { id: true, batch: { select: { name: true } } },
    });

    if (occupied) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            areaId: `A área selecionada já está ocupada pelo lote "${occupied.batch.name}".`,
          },
        },
        { status: 400 },
      );
    }

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({
        data: {
          name,
          notes,
          propertyId,
        },
      });

      if (hasMeta) {
        await tx.batchSaleGoal.create({
          data: {
            batchId: created.id,
            targetDate,
            targetWeight,
          },
        });
      }

      await tx.batchAreaHistory.create({
        data: {
          batchId: created.id,
          areaId,
          enteredAt: new Date(),
          notes,
        },
      });

      return created;
    });

    return NextResponse.json(
      { success: true, data: { id: batch.id } },
      { status: 201 },
    );
  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
