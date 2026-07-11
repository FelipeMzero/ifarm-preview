import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../../dbErrors";
import { animalApiSchema } from "../../schemas";



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const animal = await prisma.animal.findUnique({ where: { id } });

    if (!animal) {
      return NextResponse.json({ message: "Animal não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      earTag:          animal.earTag          ?? "",
      rfid:            animal.rfid            ?? "",
      name:            animal.name            ?? "",
      sex:             animal.sex,
      origin:          animal.origin,
      status:          animal.status,
      originFarmName:  animal.originFarmName  ?? "",
      motherId:        animal.motherId        ?? "",
      fatherId:        animal.fatherId        ?? "",
      birthDate:       animal.birthDate?.toISOString().slice(0, 10) ?? "",
      acquisitionDate: animal.acquisitionDate?.toISOString().slice(0, 10) ?? "",
      birthWeightKg:   animal.birthWeightKg?.toString()  ?? "",
      currentWeightKg: animal.currentWeightKg?.toString() ?? "",
      purchasePrice:   animal.purchasePrice?.toString()  ?? "",
      entryAgeMonths:  animal.entryAgeMonths?.toString() ?? "",
      breedId:         animal.breedId?.toString()        ?? "",
      batchId:         animal.batchId?.toString()         ?? "",
      originFarmId:    animal.originFarmId?.toString()    ?? "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = animalApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const animal = await prisma.animal.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, data: animal });

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
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.animal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
