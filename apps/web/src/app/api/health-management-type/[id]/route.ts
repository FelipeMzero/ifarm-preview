import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  uniqueConstraintErrors,
  referencedElsewhereMessage,
} from "@/server/db-errors";
import { healthManagementTypeApiSchema } from "../../schemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS["tipos-sanitarios"]);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = healthManagementTypeApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const type = await prisma.healthManagementType.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, message: "Tipo de manejo sanitário não encontrado." },
        { status: 404 },
      );
    }

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

// Exclusão condicionada: bloqueada se houver procedimento sanitário vinculado (use PATCH para inativar).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS["tipos-sanitarios"]);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.healthManagementType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, message: "Tipo de manejo sanitário não encontrado." },
        { status: 404 },
      );
    }

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

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS["tipos-sanitarios"]);
  if (response) return response;

  const { id } = await params;

  try {
    const type = await prisma.healthManagementType.findUnique({
      where: { id },
      select: { deactivatedAt: true },
    });

    if (!type) {
      return NextResponse.json(
        { message: "Tipo de manejo sanitário não encontrado." },
        { status: 404 },
      );
    }

    const updated = await prisma.healthManagementType.update({
      where: { id },
      data: { deactivatedAt: type.deactivatedAt ? null : new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
