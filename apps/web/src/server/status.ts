// Ativar/Desativar: regra comum aos cadastros que têm `deactivatedAt` (pessoas, raças, áreas...).
// Desativar não apaga: o registro some das opções de novos lançamentos, mas o histórico continua.

/** Alterna entre ativo (null) e desativado (agora). */
export function toggledDeactivatedAt(
  current: Date | null,
  now: Date = new Date(),
): Date | null {
  return current ? null : now;
}
