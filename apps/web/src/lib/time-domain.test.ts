import { describe, expect, it } from "vitest";
import { timeDomain, timeTicks } from "./time-domain";

const DAY = 24 * 60 * 60 * 1000;
const midnight = (y: number, m: number, d: number) =>
  new Date(y, m, d).getTime();

describe("timeDomain", () => {
  it("vai do primeiro ao último ponto", () => {
    expect(timeDomain([3 * DAY, 1 * DAY, 2 * DAY])).toEqual([DAY, 3 * DAY]);
  });

  it("com um só instante, abre dias para cada lado (eixo sem largura zero)", () => {
    expect(timeDomain([10 * DAY])).toEqual([3 * DAY, 17 * DAY]);
    expect(timeDomain([10 * DAY, 10 * DAY], 1)).toEqual([9 * DAY, 11 * DAY]);
  });
});

describe("timeTicks", () => {
  // Caso do GMD simulado zero: a projeção vai de hoje até hoje + 30 dias.
  const today = midnight(2026, 9, 22);
  const domain: [number, number] = [today, today + 30 * DAY];
  const ticks = timeTicks(domain);

  it("marcações únicas, dentro do domínio, à meia-noite", () => {
    expect(new Set(ticks).size).toBe(ticks.length);
    expect(ticks.every((t) => t >= domain[0] && t <= domain[1])).toBe(true);
    expect(ticks.every((t) => new Date(t).getHours() === 0)).toBe(true);
  });

  it("igualmente espaçadas, no máximo o limite pedido", () => {
    expect(ticks).toEqual([0, 6, 12, 18, 24, 30].map((d) => today + d * DAY));
    expect(timeTicks([today, today + 400 * DAY]).length).toBeLessThanOrEqual(6);
  });

  it("começa no primeiro dia inteiro do domínio", () => {
    const noon = today + DAY / 2;
    expect(timeTicks([noon, noon + 5 * DAY])[0]).toBe(today + DAY);
  });
});
