import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";

// Cancela um plano pendente. O registro é mantido (cancelledAt) para auditoria.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    const cancelled = await prisma.animalBatchTransfer.updateMany({
      where: {
        id,
        confirmedAt: null,
        cancelledAt: null,
        managementSessionId: null,
      },
      data: { cancelledAt: new Date() },
    });

    if (cancelled.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Somente transferências pendentes (fora de sessões de manejo) podem ser canceladas.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
