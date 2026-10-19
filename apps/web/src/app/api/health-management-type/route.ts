import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "@/server/db-errors";
import { healthManagementTypeApiSchema } from "../schemas";

export async function GET() {
  const { response } = await requireSession(RESOURCE_ACCESS["tipos-sanitarios"]);
  if (response) return response;

  try {
    const types = await prisma.healthManagementType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS["tipos-sanitarios"]);
  if (response) return response;

  try {
    const body = await request.json();
    const validation = healthManagementTypeApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const type = await prisma.healthManagementType.create({ data: validation.data });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
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
