import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { unavailableReason } from "@/lib/animal-availability";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { batchTransferApiSchema } from "../../schemas";
import {
  assertNoConflicts,
  CommitmentError,
  commitmentErrorResponse,
} from "../../animal/commitments";
import { transferStatus, validateTransferPlan } from "../shared";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    const transfer = await prisma.animalBatchTransfer.findUnique({
      where: { id },
      include: {
        destinationBatch: { select: { id: true, name: true } },
        items: {
          orderBy: { id: "asc" },
          include: {
            originBatch: { select: { id: true, name: true } },
            animal: {
              select: {
                id: true,
                code: true,
                currentTag: true,
                currentRfid: true,
                name: true,
                sex: true,
                status: true,
                currentPropertyId: true,
                currentWeight: true,
                currentBatch: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { message: "Transferência não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: transfer.id,
      transferDate: transfer.transferDate.toISOString().slice(0, 10),
      notes: transfer.notes ?? "",
      destinationBatch: transfer.destinationBatch,
      propertyId: transfer.propertyId,
      status: transferStatus(transfer),
      confirmedAt: transfer.confirmedAt?.toISOString() ?? null,
      cancelledAt: transfer.cancelledAt?.toISOString() ?? null,
      updatedAt: transfer.updatedAt.toISOString(),
      animals: transfer.items.map(({ animal, originBatch }) => ({
        id: animal.id,
        code: animal.code,
        earTag: animal.currentTag,
        rfid: animal.currentRfid,
        name: animal.name,
        sex: animal.sex,
        status: animal.status,
        currentWeightKg: animal.currentWeight?.toNumber() ?? null,
        currentBatch: animal.currentBatch,
        originBatch,
        // Só pendente: depois de encerrada, não há o que remover.
        unavailableReason:
          transferStatus(transfer) === "pending"
            ? unavailableReason(animal, transfer.propertyId)
            : null,
      })),
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
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = batchTransferApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;

    const current = await prisma.animalBatchTransfer.findUnique({
      where: { id },
      include: { items: { select: { id: true, animalId: true } } },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Transferência não encontrada." },
        { status: 404 },
      );
    }

    if (current.managementSessionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Esta transferência faz parte de uma sessão de manejo e só pode ser alterada pela sessão.",
        },
        { status: 409 },
      );
    }

    if (transferStatus(current) !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Somente transferências pendentes podem ser alteradas.",
        },
        { status: 409 },
      );
    }

    const animalIds = [...new Set(data.animalIds)];
    const errors = await validateTransferPlan({
      propertyId: current.propertyId,
      destinationBatchId: data.destinationBatchId,
      animalIds,
    });

    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Mantém os itens que continuam no plano (preserva createdAt/notes) e só
    // remove/adiciona a diferença.
    const nextIds = new Set(animalIds);
    const currentIds = new Set(current.items.map((i) => i.animalId));
    const removedItemIds = current.items
      .filter((i) => !nextIds.has(i.animalId))
      .map((i) => i.id);
    const addedAnimalIds = animalIds.filter((a) => !currentIds.has(a));

    await prisma.$transaction(async (tx) => {
      // Condicional ao status para não sobrescrever uma confirmação concorrente.
      const updated = await tx.animalBatchTransfer.updateMany({
        where: { id, confirmedAt: null, cancelledAt: null },
        data: {
          transferDate: data.transferDate,
          notes: data.notes,
          destinationBatchId: data.destinationBatchId,
        },
      });

      if (updated.count !== 1) {
        throw new TransferNotPendingError();
      }

      if (removedItemIds.length) {
        await tx.animalBatchTransferItem.deleteMany({
          where: { id: { in: removedItemIds } },
        });
      }

      await assertNoConflicts(
        tx,
        addedAnimalIds,
        { kind: "transfer" },
        { transferId: id },
      );

      if (addedAnimalIds.length) {
        await tx.animalBatchTransferItem.createMany({
          data: addedAnimalIds.map((animalId) => ({
            transferId: id,
            animalId,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CommitmentError) {
      return commitmentErrorResponse(error);
    }
    if (error instanceof TransferNotPendingError) {
      return NextResponse.json(
        {
          success: false,
          message: "Somente transferências pendentes podem ser alteradas.",
        },
        { status: 409 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

class TransferNotPendingError extends Error {}
