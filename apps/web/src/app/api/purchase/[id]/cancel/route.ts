import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { errorResponse, PurchaseError } from "../../shared";

// Cancela (desconsidera) uma compra em andamento, ainda sem animais recebidos e não paga. As recepções em aberto
// (vazias) são canceladas junto.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const event = await tx.purchaseEvent.findUnique({
        where: { id },
        include: {
          receptions: { select: { managementSessionId: true } },
          _count: { select: { purchasedAnimals: true } },
        },
      });
      if (!event) throw new PurchaseError("Compra não encontrada.", 404);
      if (event.cancelledAt) {
        throw new PurchaseError("A compra já está cancelada.", 409);
      }
      if (event.confirmedAt) {
        throw new PurchaseError(
          "Uma compra consolidada não pode ser cancelada.",
          409,
        );
      }
      if (event.paidAt) {
        throw new PurchaseError("Uma compra paga não pode ser cancelada.", 409);
      }
      if (event._count.purchasedAnimals) {
        throw new PurchaseError(
          `A compra tem ${event._count.purchasedAnimals} animal(is) recebido(s) e não pode ser cancelada. Remova-os das recepções antes.`,
          409,
        );
      }

      const now = new Date();
      await tx.purchaseEvent.update({
        where: { id },
        data: { cancelledAt: now },
      });
      await tx.managementSession.updateMany({
        where: {
          id: { in: event.receptions.map((r) => r.managementSessionId) },
          confirmedAt: null,
          cancelledAt: null,
        },
        data: { cancelledAt: now },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
