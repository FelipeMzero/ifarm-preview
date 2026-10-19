import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { categoryLabel } from "@/server/purchase/reception";
import { purchasePayApiSchema } from "@/server/purchase/schemas";
import { missingValue, PurchaseError } from "@/server/purchase/shared";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

type Params = { params: Promise<{ id: string }> };

// Registra o pagamento de uma compra em andamento (data informada ou hoje). Exige o
// valor de todas as categorias conhecido; a partir daí os valores ficam bloqueados.
export async function POST(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = purchasePayApiSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paidAt = validation.data.paidAt ?? today;
    if (paidAt > today) {
      throw new PurchaseError(
        "A data do pagamento não pode ser futura.",
        400,
        "paidAt",
      );
    }

    await prisma.$transaction(async (tx) => {
      const event = await tx.purchaseEvent.findUnique({
        where: { id },
        include: { categories: { include: { breed: true } } },
      });
      if (!event) throw new PurchaseError("Compra não encontrada.", 404);
      if (event.confirmedAt || event.cancelledAt || event.paidAt) {
        throw new PurchaseError(
          "Só é possível registrar o pagamento de uma compra em andamento e ainda não paga.",
          409,
        );
      }

      const incomplete = event.categories
        .map((c) => ({ c, missing: missingValue(c) }))
        .filter((x) => x.missing);
      if (incomplete.length) {
        throw new PurchaseError(
          `Informe ${incomplete
            .map((x) => `${x.missing} de "${categoryLabel(x.c)}"`)
            .join("; ")} antes de registrar o pagamento.`,
          400,
        );
      }

      await tx.purchaseEvent.update({
        where: { id },
        data: {
          paidAt,
          paymentReference: validation.data.paymentReference,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Desfaz o pagamento (correção de um registro feito por engano): os valores voltam a
// ser editáveis. Só com a compra em andamento.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  const { id } = await params;

  try {
    const undone = await prisma.purchaseEvent.updateMany({
      where: {
        id,
        paidAt: { not: null },
        confirmedAt: null,
        cancelledAt: null,
      },
      data: { paidAt: null, paymentReference: null },
    });
    if (undone.count !== 1) {
      throw new PurchaseError(
        "Só é possível desfazer o pagamento de uma compra paga e em andamento.",
        409,
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
