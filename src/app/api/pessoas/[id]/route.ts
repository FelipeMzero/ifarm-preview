import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../../dbErrors";
import { personApiSchema } from "../../schemas";
import { buildAddressWrite } from "../helpers";



export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  const { id } = await params;

  try {
    const person = await prisma.person.findUnique({ where: { id }, include: { address: true } });

    if (!person || person.deletedAt) {
      return NextResponse.json({ message: "Pessoa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      type:              person.type,
      taxId:             person.taxId,
      name:              person.name,
      stateRegistration: person.stateRegistration ?? "",
      phone:             person.phone ?? "",
      email:             person.email ?? "",
      tradeName:         person.tradeName ?? "",
      rg:                person.rg ?? "",
      birthDate:         person.birthDate?.toISOString().slice(0, 10) ?? "",
      maritalStatus:     person.maritalStatus ?? "",
      zipCode:           person.address?.zipCode ?? "",
      street:            person.address?.street ?? "",
      number:            person.address?.number ?? "",
      complement:        person.address?.complement ?? "",
      neighborhood:      person.address?.neighborhood ?? "",
      city:              person.address?.city ?? "",
      state:             person.address?.state ?? "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  const { id } = await params;

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

    // `type` e `taxId` são imutáveis após o cadastro (RF-PESSOA-02): omitidos do update.
    const {
      name, stateRegistration, phone, email, tradeName, rg, birthDate, maritalStatus,
      zipCode, street, number, complement, neighborhood, city, state,
    } = validation.data;

    const addressData = zipCode && street && city && state
      ? { zipCode, street, number, complement, neighborhood, city, state, country: "Brasil" }
      : null;

    const current = await prisma.person.findUnique({ where: { id }, select: { addressId: true } });

    if (!current) {
      return NextResponse.json({ success: false, message: "Pessoa não encontrada." }, { status: 404 });
    }

    const person = await prisma.person.update({
      where: { id },
      data: {
        name, stateRegistration, phone, email, tradeName, rg, birthDate, maritalStatus,
        ...buildAddressWrite(addressData, current.addressId),
      },
    });

    return NextResponse.json({ success: true, data: person });

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
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  const { id } = await params;

  try {
    // Soft-delete (RN-PESSOA-03): preserva o registro em vez de apagá-lo.
    await prisma.person.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  const { id } = await params;

  try {
    const person = await prisma.person.findUnique({ where: { id }, select: { deactivatedAt: true } });

    if (!person) {
      return NextResponse.json({ message: "Pessoa não encontrada." }, { status: 404 });
    }

    const updated = await prisma.person.update({
      where: { id },
      data: { deactivatedAt: person.deactivatedAt ? null : new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
