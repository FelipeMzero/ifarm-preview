import { prisma } from "@ifarm/db";
import { PurchaseError } from "../rules";

// Desfaz o pagamento (correção de um registro feito por engano): os valores voltam a
// ser editáveis. Só com a compra em andamento.
export async function undoPurchasePayment(id: string) {
  const undone = await prisma.purchaseEvent.updateMany({
    where: {
      id,
      paymentDate: { not: null },
      confirmedAt: null,
      cancelledAt: null,
    },
    data: { paymentDate: null, paymentReference: null },
  });
  if (undone.count !== 1) {
    throw new PurchaseError(
      "Só é possível desfazer o pagamento de uma compra paga e em andamento.",
      409,
    );
  }
}
