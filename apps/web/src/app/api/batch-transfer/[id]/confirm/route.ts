import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { ConfirmError, confirmTransferInTx } from "../../confirmTransfer";

// Efetiva o plano (ver confirmTransferInTx). Transferências geradas por uma sessão de
// manejo só são efetivadas pela consolidação da sessão.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.animalBatchTransfer.findUnique({
        where: { id },
        select: { managementSessionId: true },
      });
      if (transfer?.managementSessionId) {
        throw new ConfirmError(
          "Esta transferência faz parte de uma sessão de manejo e é efetivada na consolidação da sessão.",
        );
      }
      await confirmTransferInTx(tx, id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ConfirmError) {
      return NextResponse.json(
        { success: false, message: error.message },
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
