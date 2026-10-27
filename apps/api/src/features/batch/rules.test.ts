import { describe, expect, it } from "vitest";
import { averageDailyGain, weightSeries } from "./rules";

describe("averageDailyGain", () => {
  it("calcula o GMD entre a primeira e a última pesagem da janela", () => {
    expect(
      averageDailyGain([
        { date: "2026-01-01T00:00:00.000Z", weightKg: 300 },
        { date: "2026-01-31T00:00:00.000Z", weightKg: 330 },
      ]),
    ).toBe(1);
  });

  it("exige ao menos duas pesagens com 14 dias de intervalo", () => {
    expect(
      averageDailyGain([{ date: "2026-01-01T00:00:00.000Z", weightKg: 300 }]),
    ).toBeNull();
    expect(
      averageDailyGain([
        { date: "2026-01-01T00:00:00.000Z", weightKg: 300 },
        { date: "2026-01-10T00:00:00.000Z", weightKg: 310 },
      ]),
    ).toBeNull();
  });

  it("ignora pesagens fora da janela de 180 dias", () => {
    expect(
      averageDailyGain([
        { date: "2025-01-01T00:00:00.000Z", weightKg: 100 },
        { date: "2026-01-01T00:00:00.000Z", weightKg: 300 },
        { date: "2026-01-31T00:00:00.000Z", weightKg: 330 },
      ]),
    ).toBe(1);
  });
});

describe("weightSeries", () => {
  it("usa o último peso conhecido de cada animal em cada dia", () => {
    const series = weightSeries(
      [
        { weighings: [{ date: "2026-01-01T00:00:00.000Z", weightKg: 300 }] },
        { weighings: [{ date: "2026-01-05T00:00:00.000Z", weightKg: 400 }] },
      ],
      "2026-01-01",
    );
    expect(series).toEqual([
      { date: "2026-01-01", avgWeightKg: 300, animalCount: 1 },
      { date: "2026-01-05", avgWeightKg: 350, animalCount: 2 },
    ]);
  });

  it("o dia da pesagem é o do fuso da propriedade, e não o do UTC", () => {
    // 22:00 em Cuiabá já é dia 6 em UTC.
    const series = weightSeries(
      [{ weighings: [{ date: "2026-01-05T22:00:00-04:00", weightKg: 300 }] }],
      "2026-01-01",
    );
    expect(series.map((p) => p.date)).toEqual(["2026-01-05"]);
  });

  it("pesagens anteriores à criação entram no dia da criação", () => {
    const series = weightSeries(
      [{ weighings: [{ date: "2025-12-20T08:00:00-03:00", weightKg: 280 }] }],
      "2026-01-01",
    );
    expect(series).toEqual([
      { date: "2026-01-01", avgWeightKg: 280, animalCount: 1 },
    ]);
  });
});
