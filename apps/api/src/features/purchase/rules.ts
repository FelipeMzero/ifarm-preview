import type { PurchaseCategoryData, PurchaseStatus } from "@ifarm/shared";
import type { Prisma } from "@ifarm/db";
import { BusinessError } from "../../lib/errors";

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

// Valor da categoria visto na compra. Por cabeça: estimado sobre os esperados enquanto
// em andamento; consolidada, sobre os recebidos.
export function estimatedCategoryValue(
  c: CategoryPricing & { expectedQuantity: number },
  confirmed: boolean,
  received: number,
) {
  return categoryValue(c, confirmed ? received : c.expectedQuantity);
}

// Soma só quando todos os valores são conhecidos (null = falta algum).
export function sumIfAllKnown(values: (number | null)[]): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((s, v) => s + v!, 0);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Proporção de cada animal no rateio de uma categoria que não é por cabeça. Valor
// fechado com divisão igual: partes iguais. Senão, pelo peso de entrada; quem não foi
// pesado entra com a média dos pesados (sem nenhuma pesagem, partes iguais).
export function costShares(
  c: { pricingType: string; costSplit: string },
  entryWeights: (number | null)[],
): number[] {
  if (c.pricingType === "LUMP_SUM" && c.costSplit === "EQUAL") {
    return entryWeights.map(() => 1);
  }
  const known = entryWeights.filter((w): w is number => w != null);
  const average = known.length
    ? known.reduce((s, w) => s + w, 0) / known.length
    : 1;
  return entryWeights.map((w) => w ?? average);
}

// Distribui `value` na proporção de `shares`, em centavos, com a sobra do
// arredondamento no último: a soma dos custos bate exatamente com o valor.
export function splitValue(value: number, shares: number[]) {
  const total = shares.reduce((s, w) => s + w, 0);
  const parts = shares.map((w) => round2((value * w) / total));
  const diff = round2(value - parts.reduce((s, p) => s + p, 0));
  parts[parts.length - 1] = round2(parts[parts.length - 1] + diff);
  return parts;
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

// Campos que definem quanto se paga: bloqueados depois do pagamento.
const VALUE_FIELDS = [
  "pricingType",
  "unitPrice",
  "totalPrice",
  "invoicedWeight",
  "shrinkPercent",
] as const;

type CategoryValueFields = Record<(typeof VALUE_FIELDS)[number], unknown>;

// A categoria gravada e a nova versão têm o mesmo valor (forma de preço, preços e pesos)?
export function sameValue(
  saved: CategoryValueFields,
  next: PurchaseCategoryData,
) {
  return VALUE_FIELDS.every((field) => {
    const a = saved[field];
    const b = next[field];
    if (field === "pricingType") return a === b;
    const n = (v: unknown) =>
      v == null ? null : Number((v as { toString(): string }).toString());
    return n(a) === n(b);
  });
}

type SavedCategory = CategoryValueFields & {
  id: number;
  receivedAnimals: number;
};

/**
 * O que muda nas categorias de uma compra em andamento: as removidas e os ids que já
 * existiam (os demais são criados). Depois do pagamento, vendedor, conjunto de categorias
 * e valores ficam bloqueados; categorias com animais recebidos nunca são removidas.
 */
export function planCategoryChanges(
  saved: SavedCategory[],
  next: PurchaseCategoryData[],
  payment: { paid: boolean; sellerChanged: boolean },
) {
  const keptIds = new Set(next.map((c) => c.id).filter((v) => v != null));
  const removed = saved.filter((c) => !keptIds.has(c.id));
  const existingIds = new Set(saved.map((c) => c.id));
  const added = next.filter((c) => c.id == null || !existingIds.has(c.id));

  if (payment.paid) {
    const changedValue = next.some((c) => {
      const s = saved.find((s) => s.id === c.id);
      return s && !sameValue(s, c);
    });
    if (
      payment.sellerChanged ||
      removed.length ||
      added.length ||
      changedValue
    ) {
      throw new PurchaseError(
        "A compra já foi paga: vendedor, categorias e valores não podem mudar. Desfaça o pagamento para corrigir.",
        409,
      );
    }
  }

  const withAnimals = removed.filter((c) => c.receivedAnimals > 0);
  if (withAnimals.length) {
    throw new PurchaseError(
      `Não é possível remover categorias com animais recebidos (${withAnimals
        .map((c) => `${c.receivedAnimals} animal(is)`)
        .join(", ")}).`,
      409,
      "categories",
    );
  }

  return { removedIds: removed.map((c) => c.id), existingIds };
}

type PurchaseState = {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  paymentDate: Date | null;
};

// Por que a compra não pode ser paga (null = pode). O pagamento é registrado uma vez,
// com a compra em andamento.
export function paymentBlocker(e: PurchaseState): string | null {
  if (purchaseStatus(e) !== "open" || e.paymentDate) {
    return "Só é possível registrar o pagamento de uma compra em andamento e ainda não paga.";
  }
  return null;
}

// Por que a compra não pode ser consolidada (null = pode): exige pagamento, ao menos um
// animal recebido e nenhuma recepção em aberto.
export function consolidationBlocker(
  e: PurchaseState & { receivedAnimals: number; openReceptions: number },
): string | null {
  if (purchaseStatus(e) !== "open") {
    return "Somente compras em andamento podem ser consolidadas.";
  }
  if (!e.paymentDate) {
    return "Registre o pagamento antes de consolidar a compra.";
  }
  if (!e.receivedAnimals) {
    return "A compra não tem animais recebidos. Sem animais, cancele a compra.";
  }
  if (e.openReceptions) {
    return `Há ${e.openReceptions} recepção(ões) em aberto. Conclua ou cancele antes de consolidar.`;
  }
  return null;
}

// Por que a compra não pode ser cancelada (null = pode): só em andamento, sem pagamento e
// sem animais recebidos.
export function cancellationBlocker(
  e: PurchaseState & { receivedAnimals: number },
): string | null {
  if (e.cancelledAt) return "A compra já está cancelada.";
  if (e.confirmedAt) return "Uma compra consolidada não pode ser cancelada.";
  if (e.paymentDate) return "Uma compra paga não pode ser cancelada.";
  if (e.receivedAnimals) {
    return `A compra tem ${e.receivedAnimals} animal(is) recebido(s) e não pode ser cancelada. Remova-os das recepções antes.`;
  }
  return null;
}

// Data de nascimento estimada ("AAAA-MM-DD") de um animal com `ageMonths` meses no dia `day`
// (ex.: idade pela arcada dentária no dia da recepção, no fuso da propriedade). Só conta de
// calendário: sem o dia no mês de destino (31/03 menos 1 mês), vale o último dia dele (28 ou
// 29/02), sem transbordar para o mês seguinte como o setMonth faria.
export function estimatedBirthDay(day: string, ageMonths: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const target = month - 1 - ageMonths; // negativo volta anos (normalizado pelo Date)
  const lastDay = new Date(Date.UTC(year, target + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, target, Math.min(date, lastDay)))
    .toISOString()
    .slice(0, 10);
}
