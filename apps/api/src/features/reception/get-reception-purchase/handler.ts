import type { ReceptionPurchase } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { receptionPurchaseInclude, toReceptionPurchase } from "../shared";

// Uma compra vista pela área de recepções: categorias com recebidos/esperados e as
// recepções (viagens), sem valores.
export async function getReceptionPurchase(
  id: string,
): Promise<ReceptionPurchase> {
  const event = await prisma.purchaseEvent.findUnique({
    where: { id },
    include: receptionPurchaseInclude,
  });
  if (!event) throw new NotFoundError("Compra não encontrada.");
  return toReceptionPurchase(event);
}
