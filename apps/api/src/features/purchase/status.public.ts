import type { PurchaseStatus } from "@ifarm/shared";
import type { Prisma } from "@ifarm/db";

// Situação da compra e o filtro de listagem correspondente (juntos, para não divergirem: ver
// status-where.test.ts): usados pela compra e pela recepção.

// Em andamento → consolidada (fim: custos rateados) ou cancelada (desconsiderada). O
// pagamento é um fato do andamento, não uma situação.
export function purchaseStatus(e: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}): PurchaseStatus {
  if (e.cancelledAt) return "cancelled";
  if (e.confirmedAt) return "confirmed";
  return "open";
}

// Filtro de cada situação na consulta, coerente com purchaseStatus (ver o teste).
// "all" = todas menos as canceladas.
export const PURCHASE_STATUS_WHERE = {
  open: { confirmedAt: null, cancelledAt: null },
  confirmed: { confirmedAt: { not: null }, cancelledAt: null },
  cancelled: { cancelledAt: { not: null } },
  all: { cancelledAt: null },
} satisfies Record<PurchaseStatus | "all", Prisma.PurchaseEventWhereInput>;
