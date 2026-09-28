import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { neuteringTechniqueApiSchema } from "../schemas";

export async function GET() {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const techniques = await prisma.neuteringTechnique.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: techniques });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const body = await request.json();
    const validation = neuteringTechniqueApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const technique = await prisma.neuteringTechnique.create({
      data: validation.data,
    });

    return NextResponse.json(
      { success: true, data: technique },
      { status: 201 },
    );
  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
