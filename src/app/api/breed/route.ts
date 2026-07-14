import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { breedApiSchema } from "../schemas";



export async function GET() {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const breeds = await prisma.breed.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
    return NextResponse.json({ data: breeds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

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

    // Uma raça sem uso pode ser excluída (soft delete); recriar com o mesmo nome
    // restaura o registro em vez de esbarrar na unicidade de `name`.
    const deletedBreed = await prisma.breed.findFirst({
      where: { name: validation.data.name, deletedAt: { not: null } },
    });

    const breed = deletedBreed
      ? await prisma.breed.update({
          where: { id: deletedBreed.id },
          data: { deletedAt: null, deactivatedAt: null },
        })
      : await prisma.breed.create({ data: validation.data });

    return NextResponse.json({ success: true, data: breed }, { status: deletedBreed ? 200 : 201 });

  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
