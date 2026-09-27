import type { Prisma } from "@/lib/prisma";
import { categoryValue, PurchaseError } from "./shared";

type Tx = Prisma.TransactionClient;

const round2 = (n: number) => Math.round(n * 100) / 100;

// Peso de entrada de cada animal comprado: a pesagem (não cancelada) feita na sessão
// da sua recepção.
export async function entryWeights(tx: Tx, eventId: string) {
  const purchased = await tx.purchasedAnimal.findMany({
    where: { purchaseEventId: eventId },
    select: {
      id: true,
      animalId: true,
      categoryId: true,
      reception: { select: { managementSessionId: true } },
    },
  });
  const weighings = await tx.animalWeighing.findMany({
    where: {
      cancelledAt: null,
      animalId: { in: purchased.map((p) => p.animalId) },
      management: {
        managementSessionId: {
          in: [
            ...new Set(purchased.map((p) => p.reception.managementSessionId)),
          ],
        },
      },
    },
    orderBy: [{ weighedAt: "asc" }, { id: "asc" }],
    select: { animalId: true, weight: true },
  });
  const weightOf = new Map<string, number>();
  for (const w of weighings) weightOf.set(w.animalId, w.weight.toNumber());
  return purchased.map((p) => ({
    ...p,
    weightKg: weightOf.get(p.animalId) ?? null,
  }));
}

// Soma do peso de chegada por categoria: sugestão para o peso faturado da compra por
// arroba "pesada na chegada".
export async function arrivalWeightsByCategory(tx: Tx, eventId: string) {
  const animals = await entryWeights(tx, eventId);
  const result = new Map<
    number,
    { totalKg: number; weighed: number; received: number }
  >();
  for (const a of animals) {
    const r = result.get(a.categoryId) ?? {
      totalKg: 0,
      weighed: 0,
      received: 0,
    };
    r.received += 1;
    if (a.weightKg != null) {
      r.weighed += 1;
      r.totalKg += a.weightKg;
    }
    result.set(a.categoryId, r);
  }
  return result;
}

// Distribui `value` na proporção de `shares`, em centavos, com a sobra do
// arredondamento no último: a soma dos custos bate exatamente com o valor.
function split(value: number, shares: number[]) {
  const total = shares.reduce((s, w) => s + w, 0);
  const parts = shares.map((w) => round2((value * w) / total));
  const diff = round2(value - parts.reduce((s, p) => s + p, 0));
  parts[parts.length - 1] = round2(parts[parts.length - 1] + diff);
  return parts;
}

/**
 * Rateia o custo de cada animal da compra. Feito uma única vez, na consolidação, com
 * todos os animais recebidos e todos os valores conhecidos.
 * - Por cabeça: o próprio preço.
 * - Por arroba: valor da categoria proporcional ao peso de entrada.
 * - Valor fechado: igual entre os recebidos ou proporcional ao peso (costSplit).
 * Na divisão por peso, animais sem pesagem entram com a média dos pesados (sem nenhuma
 * pesagem, o rateio é igual).
 */
export async function allocatePurchaseCosts(tx: Tx, eventId: string) {
  const categories = await tx.purchaseCategory.findMany({
    where: { eventId },
  });
  const animals = await entryWeights(tx, eventId);

  for (const category of categories) {
    const group = animals.filter((a) => a.categoryId === category.id);
    if (!group.length) continue;

    if (category.pricingType === "PER_HEAD") {
      await tx.purchasedAnimal.updateMany({
        where: { id: { in: group.map((a) => a.id) } },
        data: { cost: category.unitPrice },
      });
      continue;
    }

    const value = categoryValue(category, group.length);
    if (value == null) {
      throw new PurchaseError("Há categorias sem valor definido.", 409);
    }

    let shares: number[];
    if (category.pricingType === "LUMP_SUM" && category.costSplit === "EQUAL") {
      shares = group.map(() => 1);
    } else {
      const known = group.filter((a) => a.weightKg != null);
      const average = known.length
        ? known.reduce((s, a) => s + a.weightKg!, 0) / known.length
        : 1;
      shares = group.map((a) => a.weightKg ?? average);
    }

    const costs = split(value, shares);
    for (const [i, animal] of group.entries()) {
      await tx.purchasedAnimal.update({
        where: { id: animal.id },
        data: { cost: costs[i] },
      });
    }
  }
}
