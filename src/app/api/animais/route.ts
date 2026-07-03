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
        { nome_apelido: { contains: search, mode: "insensitive" } },
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
      idade_meses: a.data_nascimento ? 
        Math.floor((new Date().getTime() - new Date(a.data_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) 
        : null,
      peso_atual_kg: a.peso_atual_kg || a.peso_nascimento_kg,
      origem: a.origem,
      lote_nome: a.lote?.nome,
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
        nome_apelido: body.nome_apelido || null,
        sexo: body.sexo,
        origem: body.origem,
        data_nascimento: body.data_nascimento ? new Date(body.data_nascimento) : null,
        peso_nascimento_kg: body.peso_nascimento_kg ? parseFloat(body.peso_nascimento_kg) : null,
        raca_id: body.raca_id ? parseInt(body.raca_id) : null,
        lote_id: body.lote_id ? parseInt(body.lote_id) : null,
        mae_id: body.mae_id || null,
        pai_id: body.pai_id || null,
        fazenda_origem_id: body.fazenda_origem_id ? parseInt(body.fazenda_origem_id) : null,
        fazenda_origem_nome: body.fazenda_origem || null,
        data_aquisicao: body.data_aquisicao ? new Date(body.data_aquisicao) : null,
        valor_compra: body.valor_compra ? parseFloat(body.valor_compra) : null,
        idade_entrada_meses: body.idade_entrada_meses ? parseInt(body.idade_entrada_meses) : null,
        status: "ATIVO", // default na criação
        peso_atual_kg: body.peso_nascimento_kg ? parseFloat(body.peso_nascimento_kg) : null,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao criar animal:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao criar" }, { status: 500 });
  }
}
