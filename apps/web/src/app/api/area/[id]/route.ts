import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors, referencedElsewhereMessage } from "../../dbErrors";
import { areaApiSchema } from "../../schemas";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  const { id } = await params;

  try {
    const area = await prisma.area.findUnique({
      where: { id },
    });

    if (!area) {
      return NextResponse.json({ message: "Área não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      id: area.id,
      name: area.name,
      polygon: area.polygon,
      hectares: area.hectares.toNumber(),
      stockingRate: area.stockingRate.toNumber(),
      notes: area.notes ?? "",
      propertyId: area.propertyId,
      deactivatedAt: area.deactivatedAt?.toISOString() ?? null,
      updatedAt: area.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = areaApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { name, polygon, hectares, stockingRate, notes } = validation.data;

    const current = await prisma.area.findUnique({ where: { id }, select: { id: true } });
    if (!current) {
      return NextResponse.json({ success: false, message: "Área não encontrada." }, { status: 404 });
    }

    const updated = await prisma.area.update({
      where: { id },
      data: {
        name,
        polygon,
        hectares,
        stockingRate,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.area.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const referencedMessage = referencedElsewhereMessage(error);
    if (referencedMessage) {
      return NextResponse.json({ success: false, message: referencedMessage }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  const { id } = await params;

  try {
    const area = await prisma.area.findUnique({ where: { id }, select: { deactivatedAt: true } });

    if (!area) {
      return NextResponse.json({ message: "Área não encontrada." }, { status: 404 });
    }

    const updated = await prisma.area.update({
      where: { id },
      data: { deactivatedAt: area.deactivatedAt ? null : new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
