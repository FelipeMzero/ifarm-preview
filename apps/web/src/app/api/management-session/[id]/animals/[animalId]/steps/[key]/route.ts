import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { clearAnimalStep, saveAnimalStep } from "../../../../../records";
import { errorResponse, validationErrors } from "../../../../../shared";

type Params = {
  params: Promise<{ id: string; animalId: string; key: string }>;
};

// Registra (ou corrige) uma etapa do manejo no animal.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    const body = await request.json();
    await prisma.$transaction((tx) =>
      saveAnimalStep(tx, id, animalId, decodeURIComponent(key), body),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) return validationErrors(error);
    return errorResponse(error);
  }
}

// Desfaz o registro da etapa no animal.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    await prisma.$transaction((tx) =>
      clearAnimalStep(tx, id, animalId, decodeURIComponent(key)),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
