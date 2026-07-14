import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../../dbErrors";
import { breedApiSchema } from "../../schemas";



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = breedApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const breed = await prisma.breed.update({ where: { id }, data: validation.data });

    return NextResponse.json({ success: true, data: breed });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ success: false, message: "Raça não encontrada." }, { status: 404 });
    }

    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



// Raça sem nenhum animal vinculado: soft delete (some das listagens). Raça já usada
// por algum animal: apenas desativa (some só da seleção ao cadastrar/editar animal,
// mas continua visível em qualquer lugar que a referencie, preservando o histórico).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  const { id } = await params;

  try {
    const animalCount = await prisma.animal.count({ where: { breedId: id } });

    await prisma.breed.update({
      where: { id },
      data: animalCount > 0 ? { deactivatedAt: new Date() } : { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ success: false, message: "Raça não encontrada." }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
