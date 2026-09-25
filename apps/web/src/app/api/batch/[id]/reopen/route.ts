import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { batchReopenApiSchema } from "../../../schemas";

class ReopenError extends Error {
  constructor(
    message: string,
    public status = 409,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

// Reativa um lote encerrado numa área livre. Abre um novo registro de área (em vez
// de reabrir o antigo) para o período encerrado continuar visível no histórico.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = batchReopenApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { areaId, notes } = validation.data;

    await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id },
        select: { closedAt: true, propertyId: true },
      });
      if (!batch) throw new ReopenError("Lote não encontrado.", 404);
      if (!batch.closedAt) throw new ReopenError("O lote não está encerrado.");

      const area = await tx.area.findFirst({
        where: { id: areaId, propertyId: batch.propertyId, closedAt: null },
        select: { id: true },
      });
      if (!area) {
        throw new ReopenError("Área inválida.", 400, {
          areaId: "Área inválida ou inativa para a propriedade do lote.",
        });
      }

      const occupied = await tx.batchAreaHistory.findFirst({
        where: {
          areaId,
          exitedAt: null,
          batchId: { not: id },
          batch: { closedAt: null },
        },
        select: { batch: { select: { name: true } } },
      });
      if (occupied) {
        throw new ReopenError("Área ocupada.", 400, {
          areaId: `A área selecionada já está ocupada pelo lote "${occupied.batch.name}".`,
        });
      }

      // Condicional ao status para não reativar duas vezes em requisições simultâneas.
      const reopened = await tx.batch.updateMany({
        where: { id, closedAt: { not: null } },
        data: { closedAt: null },
      });
      if (reopened.count !== 1) {
        throw new ReopenError("O lote não está encerrado.");
      }

      await tx.batchAreaHistory.create({
        data: { batchId: id, areaId, enteredAt: new Date(), notes },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ReopenError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          ...(error.errors ? { errors: error.errors } : {}),
        },
        { status: error.status },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
