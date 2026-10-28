import type { PurchaseData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../../lib/db-dates";
import { getOrAssignCurrentProperty } from "../../current-property/resolve.public";
import { PurchaseError } from "../rules";

// Registra a negociação: título, vendedor e as categorias negociadas (com preços). Nenhum animal
// existe ainda; eles são criados nas recepções.
export async function createPurchase(data: PurchaseData, userId: string) {
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) throw new PurchaseError("Nenhuma propriedade selecionada.");

  const seller = await prisma.person.findFirst({
    where: { id: data.sellerId, deactivatedAt: null },
    select: { id: true },
  });
  if (!seller) throw new PurchaseError("Vendedor inválido.", 400, "sellerId");

  const event = await prisma.purchaseEvent.create({
    data: {
      title: data.title,
      purchaseDate: toDbDate(data.purchaseDate),
      notes: data.notes,
      sellerId: data.sellerId,
      destinationPropertyId: propertyId,
      categories: {
        create: data.categories.map((c) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = c;
          return rest;
        }),
      },
    },
  });
  return { id: event.id };
}
