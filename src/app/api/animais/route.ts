import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (search) {
      filters.OR = [
        { brinco: { contains: search, mode: "insensitive" } },
        { rfid: { contains: search, mode: "insensitive" } },
        { nome: { contains: search, mode: "insensitive" } },
      ];
    }

    const animais = await prisma.animal.findMany({
      where: filters,
      include: {
        raca: true,
        lote: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Adaptando para o formato esperado pelo frontend que usava mock
    const data = animais.map((a: any) => ({
      id: a.id,
      brinco: a.brinco,
      rfid: a.rfid,
      raca: a.raca?.nome,
      sexo: a.sexo,
      idadeMeses: a.dataNascimento ?
        Math.floor((new Date().getTime() - new Date(a.dataNascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : null,
      pesoAtualKg: a.pesoAtualKg || a.pesoNascimentoKg,
      origem: a.origem,
      loteNome: a.lote?.nome,
      status: a.status,
    }));

    return NextResponse.json({
      total: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error("Erro ao listar animais:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await prisma.animal.create({
      data: {
        brinco: body.brinco || null,
        rfid: body.rfid || null,
        nome: body.nome || null,
        sexo: body.sexo,
        origem: body.origem,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        pesoNascimentoKg: body.pesoNascimentoKg ? parseFloat(body.pesoNascimentoKg) : null,
        racaId: body.racaId ? parseInt(body.racaId) : null,
        loteId: body.loteId ? parseInt(body.loteId) : null,
        maeId: body.maeId || null,
        paiId: body.paiId || null,
        fazendaOrigemId: body.fazendaOrigemId ? parseInt(body.fazendaOrigemId) : null,
        fazendaOrigemNome: body.fazendaOrigem || null,
        dataAquisicao: body.dataAquisicao ? new Date(body.dataAquisicao) : null,
        valorCompra: body.valorCompra ? parseFloat(body.valorCompra) : null,
        idadeEntradaMeses: body.idadeEntradaMeses ? parseInt(body.idadeEntradaMeses) : null,
        status: "ATIVO", // default na criação
        pesoAtualKg: body.pesoNascimentoKg ? parseFloat(body.pesoNascimentoKg) : null,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao criar animal:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao criar" }, { status: 500 });
  }
}
