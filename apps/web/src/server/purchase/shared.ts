import "server-only";
import type { Prisma } from "@/lib/prisma";
import { BusinessError } from "@/server/errors";

export type PurchaseStatus = "open" | "confirmed" | "cancelled";

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

export class PurchaseError extends BusinessError {}

// Arroba de peso vivo (rendimento de carcaça de ~50% sobre 15 kg).
export const ARROBA_LIVE_KG = 30;

type CategoryPricing = {
  pricingType: string;
  unitPrice: Prisma.Decimal | null;
  totalPrice: Prisma.Decimal | null;
  invoicedWeight: Prisma.Decimal | null;
  shrinkPercent: Prisma.Decimal | null;
};

/**
 * Valor da categoria. Por cabeça depende de quantos animais: `heads` (esperados para a
 * estimativa, recebidos no rateio). Por arroba precisa do peso faturado. Null se faltar
 * dado.
 */
export function categoryValue(c: CategoryPricing, heads: number) {
  const unit = c.unitPrice?.toNumber() ?? null;
  if (c.pricingType === "PER_HEAD") return unit == null ? null : unit * heads;
  if (c.pricingType === "LUMP_SUM") return c.totalPrice?.toNumber() ?? null;
  const invoiced = c.invoicedWeight?.toNumber() ?? null;
  if (unit == null || invoiced == null) return null;
  const shrink = c.shrinkPercent?.toNumber() ?? 0;
  return ((invoiced * (1 - shrink / 100)) / ARROBA_LIVE_KG) * unit;
}

// O que falta para o valor da categoria ser conhecido (null = completo). Os preços são
// exigidos já na criação; o peso por arroba pode vir depois, até o pagamento.
export function missingValue(c: CategoryPricing) {
  if (c.pricingType === "LUMP_SUM") {
    return c.totalPrice == null ? "o valor total" : null;
  }
  if (c.unitPrice == null) {
    return c.pricingType === "PER_HEAD"
      ? "o preço por cabeça"
      : "o preço da arroba";
  }
  if (c.pricingType === "PER_ARROBA" && c.invoicedWeight == null) {
    return "o peso faturado";
  }
  return null;
}
