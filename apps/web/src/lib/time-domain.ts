const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Domínio de um eixo de tempo (ms): do primeiro ao último ponto. Com todos os pontos no
 * mesmo instante (ex.: uma única pesagem), abre `padDays` para cada lado: um domínio de
 * largura zero faz o Recharts repetir a mesma marcação várias vezes no eixo.
 */
export function timeDomain(ts: number[], padDays = 7): [number, number] {
  const min = Math.min(...ts);
  const max = Math.max(...ts);
  return min === max
    ? [min - padDays * DAY_MS, max + padDays * DAY_MS]
    : [min, max];
}

/**
 * Marcações de um eixo de tempo: dias inteiros (meia-noite local), igualmente espaçados
 * dentro do domínio, no máximo `maxTicks`. O cálculo automático do Recharts escolhe
 * números "redondos" em milissegundos: caem no meio do dia (rótulos de data repetidos) e
 * fora do domínio (marcações repetidas na borda do eixo).
 */
export function timeTicks([start, end]: [number, number], maxTicks = 6) {
  const first = new Date(start);
  first.setHours(0, 0, 0, 0);
  if (first.getTime() < start) first.setDate(first.getDate() + 1);

  const days = Math.max(0, Math.floor((end - first.getTime()) / DAY_MS));
  const step = Math.max(1, Math.ceil(days / Math.max(1, maxTicks - 1)));

  const ticks: number[] = [];
  for (
    const d = new Date(first);
    d.getTime() <= end;
    d.setDate(d.getDate() + step)
  ) {
    ticks.push(d.getTime());
  }
  return ticks;
}
