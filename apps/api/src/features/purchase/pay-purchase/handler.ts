import { todayInZone, type PurchasePaymentData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../../lib/db-dates";
import { propertyTimeZone } from "../../property/time-zone.public";
import { categoryLabel } from "../reception.public";
import { missingValue, paymentBlocker, PurchaseError } from "../rules";

// Registra o pagamento de uma compra em andamento (data informada ou hoje, no fuso da
// propriedade). Exige o valor de todas as categorias conhecido; a partir daí os valores ficam
// bloqueados.
export async function payPurchase(id: string, data: PurchasePaymentData) {
  await prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id },
      include: { categories: { include: { breed: true } } },
    });
    if (!event) throw new PurchaseError("Compra não encontrada.", 404);

    const today = todayInZone(
      await propertyTimeZone(event.destinationPropertyId, tx),
    );
    const paidDay = data.paymentDate ?? today;
    if (paidDay > today) {
      throw new PurchaseError(
        "A data do pagamento não pode ser futura.",
        400,
        "paymentDate",
      );
    }

    const blocker = paymentBlocker(event);
    if (blocker) throw new PurchaseError(blocker, 409);

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
        paymentDate: toDbDate(paidDay),
        paymentReference: data.paymentReference,
      },
    });
  });
}
