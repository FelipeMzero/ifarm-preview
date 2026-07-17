import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// Lista enxuta de propriedades para o seletor de "propriedade atual" (troca de contexto).
// Sem restrição de papel: mesmo quem não pode gerenciar propriedades precisa escolher
// em qual está trabalhando.
export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const properties = await prisma.property.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
