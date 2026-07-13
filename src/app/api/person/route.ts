import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { personApiSchema, personQuerySchema } from "../schemas";
import { buildAddressWrite } from "../addressHelpers";



export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = personQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
    }

    const { page, pageSize, search, type } = validation.data;

    const where = {
      deletedAt: null,
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { taxId: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(type ? { type } : {}),
    };

    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.person.count({ where }),
    ]);

    return NextResponse.json({
      data: people.map((p) => ({
        id:            p.id,
        type:          p.type,
        taxId:         p.taxId,
        name:          p.name,
        phone:         p.phone,
        email:         p.email,
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
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const body = await request.json();

    const validation = personApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { zipCode, street, number, complement, neighborhood, city, state, ...personData } = validation.data;
    const addressData = zipCode && street && city && state
      ? { zipCode, street, number, complement, neighborhood, city, state, country: "Brasil" }
      : null;

    // Documento de um registro excluído pode ser reaproveitado: restaura em vez de bloquear por unicidade.
    const deletedPerson = await prisma.person.findFirst({
      where: { taxId: personData.taxId, deletedAt: { not: null } },
    });

    const person = deletedPerson
      ? await prisma.person.update({
          where: { id: deletedPerson.id },
          data: {
            ...personData,
            deletedAt: null,
            deactivatedAt: null,
            ...buildAddressWrite(addressData, deletedPerson.addressId),
          },
        })
      : await prisma.person.create({
          data: {
            ...personData,
            ...(addressData ? { address: { create: addressData } } : {}),
          },
        });

    return NextResponse.json({ success: true, data: person }, { status: deletedPerson ? 200 : 201 });

  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
