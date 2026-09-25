import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";

class CloseError extends Error {
  constructor(
    message: string,
    public status = 409,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

// Encerra um lote vazio e libera a área que ele ocupava. Lote com animais ativos ou
// destino de transferências pendentes não pode ser encerrado.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id },
        select: { closedAt: true },
      });
      if (!batch) throw new CloseError("Lote não encontrado.", 404);
      if (batch.closedAt) throw new CloseError("O lote já está encerrado.");

      const animalCount = await tx.animal.count({
        where: { currentBatchId: id, status: "ACTIVE" },
      });
      if (animalCount > 0) {
        throw new CloseError(
          `O lote ainda tem ${animalCount} animal(is). Transfira-os antes de encerrar.`,
          409,
          { code: "HAS_ANIMALS", animalCount },
        );
      }

      const pendingIncoming = await tx.animalBatchTransfer.count({
        where: { destinationBatchId: id, confirmedAt: null, cancelledAt: null },
      });
      if (pendingIncoming > 0) {
        throw new CloseError(
          `O lote é destino de ${pendingIncoming} transferência(s) pendente(s). Cancele-as ou altere o destino antes de encerrar.`,
          409,
          { code: "HAS_PENDING_TRANSFERS", pendingIncoming },
        );
      }

      const now = new Date();
      // Condicional ao status para não encerrar duas vezes em requisições simultâneas.
      const closed = await tx.batch.updateMany({
        where: { id, closedAt: null },
        data: { closedAt: now },
      });
      if (closed.count !== 1) throw new CloseError("O lote já está encerrado.");

      await tx.batchAreaHistory.updateMany({
        where: { batchId: id, exitedAt: null },
        data: { exitedAt: now },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CloseError) {
      return NextResponse.json(
        { success: false, message: error.message, ...error.details },
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
