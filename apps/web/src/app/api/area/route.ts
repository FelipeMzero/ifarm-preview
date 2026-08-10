import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { areaApiSchema, areaQuerySchema } from "../schemas";
import { getOrAssignCurrentProperty } from "../user/current-property/currentProperty";

export async function GET(request: NextRequest) {
  const { session, response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = areaQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
    }

    let { propertyId, status } = validation.data;

    if (!propertyId) {
      const currentProp = await getOrAssignCurrentProperty(session.user.id);
      if (!currentProp) {
        return NextResponse.json({ data: [] });
      }
      propertyId = currentProp.id;
    }

    const where = {
      propertyId,
      ...(status === "active" ? { deactivatedAt: null } : {}),
      ...(status === "inactive" ? { deactivatedAt: { not: null } } : {}),
    };

    const areas = await prisma.area.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: areas.map((a) => ({
        id: a.id,
        name: a.name,
        polygon: a.polygon,
        hectares: a.hectares.toNumber(),
        stockingRate: a.stockingRate.toNumber(),
        notes: a.notes,
        propertyId: a.propertyId,
        deactivatedAt: a.deactivatedAt?.toISOString() ?? null,
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const body = await request.json();
    const validation = areaApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { name, polygon, hectares, stockingRate, notes, propertyId } = validation.data;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, deactivatedAt: true },
    });

    if (!property || property.deactivatedAt) {
      return NextResponse.json({ success: false, errors: { propertyId: "Propriedade inválida ou inativa." } }, { status: 400 });
    }

    const area = await prisma.area.create({
      data: {
        name,
        polygon,
        hectares,
        stockingRate,
        notes,
        propertyId,
      },
    });

    return NextResponse.json({ success: true, data: area }, { status: 201 });
  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
