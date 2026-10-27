import { DAY_MS, today as todayDay, toLocalDay } from "../date";
import type { BatchDetailAnimal } from "./client";

// Projeção linear da meta de peso do lote. Cada animal cresce a partir da sua última
// pesagem no próprio GMD (ou, sem histórico, no GMD médio do lote); o peso médio do lote
// numa data é a média dessas projeções — e, por ser linear, dá para resolver a data em
// que o lote atinge a meta.
//
// Fica no shared porque roda no cliente: a tela simula outros GMDs sem chamar o
// servidor. O GMD de cada animal (adgKgPerDay) vem calculado pela API.

export type BatchProjection = {
  weighedCount: number;
  unweighedCount: number;
  /** GMD médio medido (animais com pesagens suficientes). */
  measuredAdg: number | null;
  measuredAdgCount: number;
  /** GMD usado na projeção (simulado ou medido). */
  adg: number | null;
  /** Peso médio estimado para hoje. */
  projectedTodayKg: number | null;
  targetWeightKg: number | null;
  targetDate: string | null;
  daysLeft: number | null;
  /** Peso médio projetado na data da meta. */
  projectedAtTargetKg: number | null;
  /** GMD necessário, a partir de hoje, para chegar à meta na data. */
  requiredAdg: number | null;
  /** Data estimada em que o peso médio atinge a meta. */
  estimatedDate: Date | null;
  reached: boolean;
  onTrack: boolean | null;
  animalsAtTarget: number;
  /** Peso médio projetado numa data qualquer (null sem GMD). */
  projectAt: (date: Date) => number | null;
  /** Peso projetado de um animal na data da meta. */
  projectAnimal: (animal: BatchDetailAnimal) => number | null;
};

const mean = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;

export function projectBatch(
  animals: BatchDetailAnimal[],
  goal: { targetDate: string | null; targetWeightKg: number | null } | null,
  simulatedAdg?: number | null,
): BatchProjection {
  const today = toLocalDay(todayDay());
  const weighed = animals.filter(
    (a) => a.currentWeightKg != null && a.lastWeighingDate != null,
  );

  const measuredAdgs = animals
    .map((a) => a.adgKgPerDay)
    .filter((g): g is number => g != null);
  const measuredAdg = mean(measuredAdgs);
  const useSimulated = simulatedAdg != null && Number.isFinite(simulatedAdg);
  const adg = useSimulated ? simulatedAdg : measuredAdg;

  const adgOf = (a: BatchDetailAnimal) =>
    useSimulated ? simulatedAdg : (a.adgKgPerDay ?? measuredAdg);

  const projectAnimalAt = (a: BatchDetailAnimal, date: Date) => {
    if (a.currentWeightKg == null || !a.lastWeighingDate) return null;
    const g = adgOf(a);
    if (g == null) return null;
    const days =
      (date.getTime() - new Date(a.lastWeighingDate).getTime()) / DAY_MS;
    return a.currentWeightKg + g * days;
  };

  const projectAt = (date: Date) => {
    if (!weighed.length || adg == null) return null;
    return mean(weighed.map((a) => projectAnimalAt(a, date)!));
  };

  const targetWeightKg = goal?.targetWeightKg ?? null;
  const targetDate = goal?.targetDate ?? null;
  const target = targetDate ? toLocalDay(targetDate) : null;

  // Sem GMD, o "hoje" é só a média dos pesos atuais.
  const projectedTodayKg =
    projectAt(today) ?? mean(weighed.map((a) => a.currentWeightKg!));

  const daysLeft = target
    ? Math.round((target.getTime() - today.getTime()) / DAY_MS)
    : null;

  const reached =
    targetWeightKg != null &&
    projectedTodayKg != null &&
    projectedTodayKg >= targetWeightKg;

  const projectedAtTargetKg = target ? projectAt(target) : null;

  const requiredAdg =
    targetWeightKg != null &&
    projectedTodayKg != null &&
    daysLeft != null &&
    daysLeft > 0 &&
    !reached
      ? (targetWeightKg - projectedTodayKg) / daysLeft
      : null;

  let estimatedDate: Date | null = null;
  if (targetWeightKg != null && projectedTodayKg != null && adg != null) {
    if (reached) estimatedDate = today;
    else if (adg > 0) {
      const days = (targetWeightKg - projectedTodayKg) / adg;
      estimatedDate = new Date(today.getTime() + days * DAY_MS);
    }
  }

  const onTrack =
    targetWeightKg == null
      ? null
      : reached
        ? true
        : projectedAtTargetKg != null
          ? projectedAtTargetKg >= targetWeightKg
          : null;

  return {
    weighedCount: weighed.length,
    unweighedCount: animals.length - weighed.length,
    measuredAdg,
    measuredAdgCount: measuredAdgs.length,
    adg,
    projectedTodayKg,
    targetWeightKg,
    targetDate,
    daysLeft,
    projectedAtTargetKg,
    requiredAdg,
    estimatedDate,
    reached,
    onTrack,
    animalsAtTarget:
      targetWeightKg == null
        ? 0
        : weighed.filter((a) => a.currentWeightKg! >= targetWeightKg).length,
    projectAt,
    projectAnimal: (a) => (target ? projectAnimalAt(a, target) : null),
  };
}
