import type {
  ReceptionPurchaseListResult,
  ReceptionPurchaseQuery,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { isPending } from "../rules";
import { receptionPurchaseInclude, toReceptionPurchase } from "../shared";

// Compras da propriedade vistas pela área de recepções (sem valores).
export async function listReceptionPurchases({
  propertyId,
  page,
  pageSize,
  search,
  filter,
}: ReceptionPurchaseQuery): Promise<ReceptionPurchaseListResult> {
  // "A receber" depende das contagens: filtra depois de montar (volume pequeno).
  const events = await prisma.purchaseEvent.findMany({
    where: {
      destinationPropertyId: propertyId,
      cancelledAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { seller: { name: { contains: search, mode: "insensitive" } } },
              {
                receptions: {
                  some: {
                    gtaNumber: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: receptionPurchaseInclude,
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
  });

  const all = events.map(toReceptionPurchase);
  const rows = filter === "pending" ? all.filter(isPending) : all;

  return {
    data: rows.slice(page * pageSize, (page + 1) * pageSize),
    total: rows.length,
    page,
    pageSize,
    pageCount: Math.ceil(rows.length / pageSize),
  };
}
