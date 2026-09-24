import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";

// GET e PUT ainda não foram reconstruídos para o schema atual do Animal
// (edição de animal é uma tela à parte, ainda não implementada).

export async function GET() {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  return NextResponse.json(
    { message: "Consulta de animal ainda não implementada." },
    { status: 501 },
  );
}

export async function PUT() {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  return NextResponse.json(
    { success: false, message: "Edição de animal ainda não implementada." },
    { status: 501 },
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.animal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
