import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uniqueConstraintErrors } from "../../dbErrors";
import { animalApiSchema } from "../../schemas";



export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const animal = await prisma.animal.findUnique({ where: { id } });

    if (!animal) {
      return NextResponse.json({ message: "Animal não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      brinco:            animal.brinco            ?? "",
      rfid:              animal.rfid              ?? "",
      nome:              animal.nome              ?? "",
      sexo:              animal.sexo,
      origem:            animal.origem,
      status:            animal.status,
      fazendaOrigemNome: animal.fazendaOrigemNome ?? "",
      maeId:             animal.maeId             ?? "",
      paiId:             animal.paiId             ?? "",
      dataNascimento:    animal.dataNascimento?.toISOString().slice(0, 10) ?? "",
      dataAquisicao:     animal.dataAquisicao?.toISOString().slice(0, 10)  ?? "",
      pesoNascimentoKg:  animal.pesoNascimentoKg?.toString() ?? "",
      pesoAtualKg:       animal.pesoAtualKg?.toString()      ?? "",
      valorCompra:       animal.valorCompra?.toString()      ?? "",
      idadeEntradaMeses: animal.idadeEntradaMeses?.toString() ?? "",
      racaId:            animal.racaId?.toString()            ?? "",
      loteId:            animal.loteId?.toString()            ?? "",
      fazendaOrigemId:   animal.fazendaOrigemId?.toString()   ?? "",
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
