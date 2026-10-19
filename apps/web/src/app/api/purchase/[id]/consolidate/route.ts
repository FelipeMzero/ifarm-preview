import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { allocatePurchaseCosts } from "@/server/purchase/costs";
import { PurchaseError } from "@/server/purchase/shared";
import { errorResponse } from "@/app/api/http";

// Consolida a compra: fim do processo. Exige pagamento, ao menos um animal recebido e
// nenhuma recepção em aberto. O custo de cada animal é rateado aqui, uma única vez; a
// partir daí nada mais muda (nem recepções novas).
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
          receptions: { select: { managementSession: true } },
          _count: { select: { purchasedAnimals: true } },
        },
      });
      if (!event) throw new PurchaseError("Compra não encontrada.", 404);
      if (event.confirmedAt || event.cancelledAt) {
        throw new PurchaseError(
          "Somente compras em andamento podem ser consolidadas.",
          409,
        );
      }
      if (!event.paidAt) {
        throw new PurchaseError(
          "Registre o pagamento antes de consolidar a compra.",
          409,
        );
      }
      if (!event._count.purchasedAnimals) {
        throw new PurchaseError(
          "A compra não tem animais recebidos. Sem animais, cancele a compra.",
          409,
        );
      }
      const open = event.receptions.filter(
        (r) =>
          !r.managementSession.confirmedAt && !r.managementSession.cancelledAt,
      );
      if (open.length) {
        throw new PurchaseError(
          `Há ${open.length} recepção(ões) em aberto. Conclua ou cancele antes de consolidar.`,
          409,
        );
      }

      const done = await tx.purchaseEvent.updateMany({
        where: { id, confirmedAt: null, cancelledAt: null },
        data: { confirmedAt: new Date() },
      });
      if (done.count !== 1) {
        throw new PurchaseError(
          "Somente compras em andamento podem ser consolidadas.",
          409,
        );
      }

      await allocatePurchaseCosts(tx, id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
