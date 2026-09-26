import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../../dbErrors";
import { animalUpdateApiSchema } from "../../schemas";
import { effectiveNeutering } from "../../management-session/effective";

// Com recastração há mais de um registro: vale o mais recente.
function latestNeuteringDate(items: { neuteredAt: Date }[]): string | null {
  const dates = items.map((item) => item.neuteredAt.toISOString());
  return dates.sort().at(-1) ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        breed: { select: { id: true, name: true } },
        currentBatch: { select: { id: true, name: true } },
        animalNeuterings: {
          where: { cancelledAt: null, ...effectiveNeutering },
          select: { neuteredAt: true },
        },
      },
    });

    if (!animal) {
      return NextResponse.json(
        { message: "Animal não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: animal.id,
      currentTag: animal.currentTag,
      currentRfid: animal.currentRfid,
      name: animal.name,
      sex: animal.sex,
      birthDate: animal.birthDate?.toISOString().slice(0, 10) ?? null,
      breedId: animal.breedId,
      breedName: animal.breed?.name ?? null,
      origin: animal.origin,
      status: animal.status,
      neutered: animal.neutered,
      neuteredAt: latestNeuteringDate(animal.animalNeuterings),
      currentBatchId: animal.currentBatchId,
      currentBatchName: animal.currentBatch?.name ?? null,
      currentPropertyId: animal.currentPropertyId,
      currentWeightKg: animal.currentWeight?.toNumber() ?? null,
      updatedAt: animal.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = animalUpdateApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;

    const current = await prisma.animal.findUnique({
      where: { id },
      select: { currentPropertyId: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Animal não encontrado." },
        { status: 404 },
      );
    }

    if (data.newBatchId) {
      const batch = await prisma.batch.findFirst({
        where: {
          id: data.newBatchId,
          propertyId: current.currentPropertyId,
          closedAt: null,
        },
        select: { id: true },
      });

      if (!batch) {
        return NextResponse.json(
          {
            success: false,
            errors: {
              newBatchId:
                "Lote inválido ou inativo para a propriedade do animal.",
            },
          },
          { status: 400 },
        );
      }
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.animal.update({
        where: { id },
        data: {
          name: data.name,
          breedId: data.breedId,
          birthDate: data.birthDate,
          sex: data.sex,
          ...(data.newTag !== undefined ? { currentTag: data.newTag } : {}),
          ...(data.newRfid !== undefined ? { currentRfid: data.newRfid } : {}),
          ...(data.newBatchId ? { currentBatchId: data.newBatchId } : {}),
          ...(data.newWeightKg != null
            ? { currentWeight: data.newWeightKg }
            : {}),
          ...(data.neuteredAt ? { neutered: true } : {}),
        },
      });

      if (data.newTag !== undefined) {
        await tx.animalTagging.create({
          data: {
            animalId: id,
            tag: data.newTag,
            notes: data.tagChangeNotes,
            identifiedAt: now,
          },
        });
      }

      if (data.newRfid !== undefined) {
        await tx.animalRfidTagging.create({
          data: {
            animalId: id,
            rfid: data.newRfid,
            notes: data.rfidChangeNotes,
            identifiedAt: now,
          },
        });
      }

      if (data.newBatchId) {
        const activeBatchHistory = await tx.animalBatchHistory.findFirst({
          where: { animalId: id, exitedAt: null },
        });

        if (activeBatchHistory) {
          await tx.animalBatchHistory.update({
            where: { id: activeBatchHistory.id },
            data: { exitedAt: now },
          });
        }

        await tx.animalBatchHistory.create({
          data: {
            animalId: id,
            batchId: data.newBatchId,
            enteredAt: now,
            notes: data.batchChangeNotes,
          },
        });
      }

      if (data.neuteredAt) {
        await tx.animalNeutering.create({
          data: {
            animalId: id,
            neuteredAt: data.neuteredAt,
            method: data.neuteringMethod,
            notes: data.neuteringNotes,
          },
        });
      }

      if (data.newWeightKg != null) {
        await tx.animalWeighing.create({
          data: {
            animalId: id,
            weight: data.newWeightKg,
            notes: data.weightChangeNotes,
            weighedAt: now,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.animal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
