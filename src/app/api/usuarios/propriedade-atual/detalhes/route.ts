import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getOrAssignCurrentProperty } from "../currentProperty";

// Detalhes da propriedade atualmente selecionada, para exibição no painel. Sem
// restrição de papel: qualquer usuário logado precisa ver em qual propriedade está.
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const current = await getOrAssignCurrentProperty(session.user.id);
  if (!current) {
    return NextResponse.json({ data: null });
  }

  const property = await prisma.property.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      name: true,
      totalArea: true,
      productiveArea: true,
      owner: { select: { name: true } },
      address: { select: { city: true, state: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      id: property.id,
      name: property.name,
      ownerName: property.owner.name,
      totalArea: property.totalArea,
      productiveArea: property.productiveArea,
      city: property.address?.city ?? null,
      state: property.address?.state ?? null,
    },
  });
}
