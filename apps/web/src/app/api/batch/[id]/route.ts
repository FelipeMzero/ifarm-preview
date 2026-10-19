import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  uniqueConstraintErrors,
  referencedElsewhereMessage,
} from "@/server/db-errors";
import { batchUpdateApiSchema } from "../../schemas";

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
        batchAreaHistories: {
          orderBy: { enteredAt: "desc" },
          include: { area: { select: { id: true, name: true } } },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { message: "Lote não encontrado." },
        { status: 404 },
      );
    }

    const activeHistory = batch.batchAreaHistories.find(
      (h) => h.exitedAt === null,
    );

    return NextResponse.json({
      id: batch.id,
      name: batch.name,
      notes: batch.notes ?? "",
      hasMeta: Boolean(batch.saleGoal),
      targetDate: batch.saleGoal?.targetDate?.toISOString().slice(0, 10) ?? null,
      targetWeight: batch.saleGoal?.targetWeight?.toNumber() ?? null,
      currentArea: activeHistory?.area ?? null,
      areaHistory: batch.batchAreaHistories.map((h) => ({
        id: h.id,
        area: h.area,
        enteredAt: h.enteredAt.toISOString(),
        exitedAt: h.exitedAt?.toISOString() ?? null,
        notes: h.notes ?? null,
      })),
      closedAt: batch.closedAt?.toISOString() ?? null,
      updatedAt: batch.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = batchUpdateApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { name, notes, hasMeta, targetDate, targetWeight, newAreaId, areaChangeDescription } =
      validation.data;

    const current = await prisma.batch.findUnique({
      where: { id },
      include: {
        saleGoal: true,
        batchAreaHistories: {
          where: { exitedAt: null },
          take: 1,
          orderBy: { enteredAt: "desc" },
        },
      },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Lote não encontrado." },
        { status: 404 },
      );
    }

    if (newAreaId) {
      const propertyId = current.propertyId;
      const area = await prisma.area.findFirst({
        where: { id: newAreaId, propertyId, closedAt: null },
        select: { id: true },
      });

      if (!area) {
        return NextResponse.json(
          {
            success: false,
            errors: { newAreaId: "Área inválida ou inativa para a propriedade selecionada." },
          },
          { status: 400 },
        );
      }

      const occupied = await prisma.batchAreaHistory.findFirst({
        where: {
          areaId: newAreaId,
          exitedAt: null,
          batchId: { not: id },
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
            errors: { newAreaId: `A área de destino já está ocupada pelo lote "${occupied.batch.name}".` },
          },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.batch.update({
        where: { id },
        data: { name, notes },
      });

      if (hasMeta) {
        if (current.saleGoal) {
          await tx.batchSaleGoal.update({
            where: { batchId: id },
            data: { targetDate, targetWeight },
          });
        } else {
          await tx.batchSaleGoal.create({
            data: { batchId: id, targetDate, targetWeight },
          });
        }
      } else if (current.saleGoal) {
        await tx.batchSaleGoal.delete({ where: { batchId: id } });
      }

      if (newAreaId) {
        const activeHistory = current.batchAreaHistories[0];
        if (activeHistory) {
          await tx.batchAreaHistory.update({
            where: { id: activeHistory.id },
            data: { exitedAt: new Date() },
          });
        }

        await tx.batchAreaHistory.create({
          data: {
            batchId: id,
            areaId: newAreaId,
            enteredAt: new Date(),
            notes: areaChangeDescription,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.batch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const referencedMessage = referencedElsewhereMessage(error);
    if (referencedMessage) {
      return NextResponse.json(
        { success: false, message: referencedMessage },
        { status: 409 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
