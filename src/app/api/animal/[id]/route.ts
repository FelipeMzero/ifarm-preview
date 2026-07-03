import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { animalApiSchema } from "@/app/animal/schema";
import { uniqueConstraintErrors } from "../apiErrors";



export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const animal = await prisma.animal.findUnique({ where: { id } });

    if (!animal) {
      return NextResponse.json({ message: "Animal não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      brinco:              animal.brinco              ?? "",
      rfid:                animal.rfid                ?? "",
      nome_apelido:        animal.nome_apelido        ?? "",
      sexo:                animal.sexo,
      origem:              animal.origem,
      status:              animal.status,
      fazenda_origem_nome: animal.fazenda_origem_nome ?? "",
      mae_id:              animal.mae_id              ?? "",
      pai_id:              animal.pai_id              ?? "",
      data_nascimento:     animal.data_nascimento?.toISOString().slice(0, 10)  ?? "",
      data_aquisicao:      animal.data_aquisicao?.toISOString().slice(0, 10)   ?? "",
      peso_nascimento_kg:  animal.peso_nascimento_kg?.toString()  ?? "",
      peso_atual_kg:       animal.peso_atual_kg?.toString()       ?? "",
      valor_compra:        animal.valor_compra?.toString()        ?? "",
      idade_entrada_meses: animal.idade_entrada_meses?.toString() ?? "",
      raca_id:             animal.raca_id?.toString()             ?? "",
      lote_id:             animal.lote_id?.toString()             ?? "",
      fazenda_origem_id:   animal.fazenda_origem_id?.toString()   ?? "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validation = animalApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const animal = await prisma.animal.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, data: animal });

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
  const { id } = await params;

  try {
    await prisma.animal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
