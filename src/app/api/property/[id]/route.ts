import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors, referencedElsewhereMessage } from "../../dbErrors";
import { propertyApiSchema } from "../../schemas";
import { buildAddressWrite } from "../../addressHelpers";



export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  const { id } = await params;

  try {
    const property = await prisma.property.findUnique({ where: { id }, include: { address: true, owner: true } });

    if (!property) {
      return NextResponse.json({ message: "Propriedade não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      name:           property.name,
      ownerId:        property.ownerId,
      ownerName:      property.owner.name,
      totalArea:      property.totalArea?.toString() ?? "",
      productiveArea: property.productiveArea?.toString() ?? "",
      cib:            property.cib ?? "",
      ccir:           property.ccir ?? "",
      car:            property.car ?? "",
      latitude:       property.latitude?.toString() ?? "",
      longitude:      property.longitude?.toString() ?? "",
      zipCode:        property.address?.zipCode ?? "",
      street:         property.address?.street ?? "",
      number:         property.address?.number ?? "",
      complement:     property.address?.complement ?? "",
      neighborhood:   property.address?.neighborhood ?? "",
      city:           property.address?.city ?? "",
      state:          property.address?.state ?? "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  const { id } = await params;

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

    const {
      name, ownerId, totalArea, productiveArea, cib, ccir, car, latitude, longitude,
      zipCode, street, number, complement, neighborhood, city, state,
    } = validation.data;

    const addressData = zipCode && street && city && state
      ? { zipCode, street, number, complement, neighborhood, city, state, country: "Brasil" }
      : null;

    const current = await prisma.property.findUnique({ where: { id }, select: { addressId: true } });

    if (!current) {
      return NextResponse.json({ success: false, message: "Propriedade não encontrada." }, { status: 404 });
    }

    const owner = await prisma.person.findUnique({ where: { id: ownerId }, select: { id: true, deactivatedAt: true } });
    if (!owner || owner.deactivatedAt) {
      return NextResponse.json({ success: false, errors: { ownerId: "Titular inválido." } }, { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name, totalArea, productiveArea, cib, ccir, car, latitude, longitude,
        owner: { connect: { id: ownerId } },
        ...buildAddressWrite(addressData, current.addressId),
      },
    });

    return NextResponse.json({ success: true, data: property });

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
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  const { id } = await params;

  try {
    // Exclusão condicionada (RN-PROPRIEDADE-04): bloqueada se houver área ou usuário vinculado.
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const referencedMessage = referencedElsewhereMessage(error);
    if (referencedMessage) {
      return NextResponse.json({ success: false, message: referencedMessage }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  const { id } = await params;

  try {
    const property = await prisma.property.findUnique({ where: { id }, select: { deactivatedAt: true } });

    if (!property) {
      return NextResponse.json({ message: "Propriedade não encontrada." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { deactivatedAt: property.deactivatedAt ? null : new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
