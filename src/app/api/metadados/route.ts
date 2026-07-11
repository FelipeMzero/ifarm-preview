import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(_request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const [racas, lotes, fazendas, animaisDisponiveis] = await Promise.all([
      prisma.raca.findMany({ orderBy: { nome: "asc" } }),
      prisma.lote.findMany({ orderBy: { nome: "asc" } }),
      prisma.fazenda.findMany({ orderBy: { nome: "asc" } }),
      prisma.animal.findMany({
        select: { id: true, brinco: true, rfid: true, sexo: true },
        orderBy: { brinco: "asc" }
      }),
    ]);

    return NextResponse.json({
      racas,
      lotes,
      fazendas,
      animaisFazenda: animaisDisponiveis,
    });
  } catch (error: any) {
    console.error("Erro ao carregar metadados:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
