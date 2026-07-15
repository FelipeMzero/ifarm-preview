import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { propertyApiSchema, propertyQuerySchema } from "../schemas";



export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = propertyQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
    }

    const { page, pageSize, search, status } = validation.data;

    const where = {
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { owner: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      } : {}),
      ...(status === "active" ? { deactivatedAt: null } : {}),
      ...(status === "inactive" ? { deactivatedAt: { not: null } } : {}),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { address: true, owner: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      data: properties.map((p) => ({
        id:            p.id,
        name:          p.name,
        totalArea:     p.totalArea,
        city:          p.address?.city ?? null,
        state:         p.address?.state ?? null,
        ownerName:     p.owner.name,
        deactivatedAt: p.deactivatedAt?.toISOString() ?? null,
        updatedAt:     p.updatedAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const body = await request.json();

    const validation = propertyApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { zipCode, street, number, complement, neighborhood, city, state, ownerId, ...propertyData } = validation.data;
    const addressData = zipCode && street && city && state
      ? { zipCode, street, number, complement, neighborhood, city, state, country: "Brasil" }
      : null;

    const owner = await prisma.person.findUnique({ where: { id: ownerId }, select: { id: true, deactivatedAt: true } });
    if (!owner || owner.deactivatedAt) {
      return NextResponse.json({ success: false, errors: { ownerId: "Titular inválido." } }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        owner: { connect: { id: ownerId } },
        ...(addressData ? { address: { create: addressData } } : {}),
      },
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });

  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
