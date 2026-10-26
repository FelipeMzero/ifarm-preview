import { fromDbDate } from "@ifarm/domain/db-dates";

// Indicadores do lote (GMD, peso médio ao longo do tempo, compras), sem banco.

const DAY_MS = 24 * 60 * 60 * 1000;
// Janela usada no GMD de cada animal: reflete o ritmo recente, não a vida toda.
const ADG_WINDOW_DAYS = 180;
// Intervalo mínimo entre a primeira e a última pesagem da janela para o GMD valer.
const ADG_MIN_SPAN_DAYS = 14;

export type Weighing = { date: string; weightKg: number };

// GMD (kg/dia) pelas pesagens da janela recente; null sem dados suficientes.
export function averageDailyGain(weighings: Weighing[]): number | null {
  const last = weighings.at(-1);
  if (!last) return null;
  const windowStart = new Date(last.date).getTime() - ADG_WINDOW_DAYS * DAY_MS;
  const recent = weighings.filter(
    (w) => new Date(w.date).getTime() >= windowStart,
  );
  const first = recent[0];
  if (!first || recent.length < 2) return null;
  const days =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / DAY_MS;
  if (days < ADG_MIN_SPAN_DAYS) return null;
  return (last.weightKg - first.weightKg) / days;
}

const dayKey = (iso: string) => iso.slice(0, 10);

// Peso médio do rebanho atual ao longo do tempo: em cada dia com pesagem, a média
// do último peso conhecido de cada animal até aquele dia. Começa na criação do lote
// (pesos anteriores entram como ponto de partida).
export function weightSeries(
  animals: { weighings: Weighing[] }[],
  since: Date,
): { date: string; avgWeightKg: number; animalCount: number }[] {
  const sinceKey = dayKey(since.toISOString());
  const days = new Set<string>();
  let hasEarlier = false;
  for (const a of animals) {
    for (const w of a.weighings) {
      const key = dayKey(w.date);
      if (key >= sinceKey) days.add(key);
      else hasEarlier = true;
    }
  }
  if (hasEarlier) days.add(sinceKey);

  return [...days].sort().flatMap((day) => {
    const weights = animals
      .map((a) => a.weighings.filter((w) => dayKey(w.date) <= day).at(-1))
      .filter((w): w is Weighing => !!w)
      .map((w) => w.weightKg);
    if (!weights.length) return [];
    return [
      {
        date: day,
        avgWeightKg: weights.reduce((s, w) => s + w, 0) / weights.length,
        animalCount: weights.length,
      },
    ];
  });
}

export type ReceptionInBatch = {
  purchaseEvent: {
    id: string;
    purchaseDate: Date;
    confirmedAt: Date | null;
    seller: { id: string; name: string };
  };
  _count: { purchasedAnimals: number };
};

// Compras que tiveram este lote como lote de entrada, somando as recepções (viagens)
// de cada compra.
export function groupPurchases(receptions: ReceptionInBatch[]) {
  const byEvent = new Map<
    string,
    ReceptionInBatch["purchaseEvent"] & { animalCount: number }
  >();
  for (const r of receptions) {
    const current = byEvent.get(r.purchaseEvent.id);
    byEvent.set(r.purchaseEvent.id, {
      ...r.purchaseEvent,
      animalCount: (current?.animalCount ?? 0) + r._count.purchasedAnimals,
    });
  }
  return [...byEvent.values()]
    .filter((e) => e.animalCount > 0)
    .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
    .map((e) => ({
      id: e.id,
      date: fromDbDate(e.purchaseDate),
      seller: e.seller,
      animalCount: e.animalCount,
      confirmed: e.confirmedAt != null,
    }));
}
