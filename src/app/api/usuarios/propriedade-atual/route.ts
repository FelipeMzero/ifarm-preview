import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getOrAssignCurrentProperty } from "@/lib/current-property";

const bodySchema = z.object({
  propertyId: z.string().min(1, "Este campo não pode ser vazio"),
});

// Retorna a propriedade atualmente selecionada pelo usuário logado. Se ele ainda não
// tiver escolhido nenhuma, assume automaticamente a mais antiga cadastrada (ou `null`
// se não houver nenhuma propriedade no sistema).
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const currentProperty = await getOrAssignCurrentProperty(session.user.id);

  return NextResponse.json({ data: currentProperty });
}

export async function PUT(request: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await request.json();
  const validation = bodySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
  }

  const { propertyId } = validation.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, deletedAt: true },
  });

  if (!property || property.deletedAt) {
    return NextResponse.json({ message: "Propriedade não encontrada." }, { status: 404 });
  }

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, currentPropertyId: propertyId },
    update: { currentPropertyId: propertyId },
  });

  return NextResponse.json({ data: { id: property.id, name: property.name } });
}
