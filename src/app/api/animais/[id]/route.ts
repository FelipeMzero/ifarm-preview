import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        raca: true,
        lote: true,
        mae: true,
        pai: true,
        fazenda_origem: true,
      },
    });

    if (!animal) {
      return NextResponse.json({ error: "Animal não encontrado" }, { status: 404 });
    }

    return NextResponse.json(animal);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.animal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir animal" }, { status: 500 });
  }
}
