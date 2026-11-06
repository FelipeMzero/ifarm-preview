import { describe, expect, it } from "vitest";
import { DAY_MS } from "@ifarm/shared";
import {
  calculateLinearRegression,
  categorizeAnimal,
  computeBatchGoals,
  computePastureStatus,
  computeProductiveEfficiency,
  computeRotationAlerts,
  projectSlaughterDate,
} from "./rules";

describe("calculateLinearRegression", () => {
  it("devolve null quando há menos de 2 pesagens", () => {
    expect(calculateLinearRegression([])).toBeNull();
    expect(
      calculateLinearRegression([{ timestamp: 1000, weightKg: 300 }]),
    ).toBeNull();
  });

  it("calcula GMD, intercepto e R² para pesagens lineares perfeitas", () => {
    const base = new Date("2026-01-01T00:00:00Z").getTime();
    const points = [
      { timestamp: base, weightKg: 300 },
      { timestamp: base + 30 * DAY_MS, weightKg: 330 },
      { timestamp: base + 60 * DAY_MS, weightKg: 360 },
    ];

    const reg = calculateLinearRegression(points);
    expect(reg).not.toBeNull();
    expect(reg?.gmd).toBe(1); // 1 kg/dia
    expect(reg?.intercept).toBeCloseTo(300, 1);
    expect(reg?.r2).toBe(1);
  });
});

describe("projectSlaughterDate", () => {
  const baseDate = new Date("2026-01-01T00:00:00Z");

  it("retorna imediatamente se já atingiu o peso alvo", () => {
    const res = projectSlaughterDate({
      regression: null,
      currentWeightKg: 460,
      targetWeightKg: 450,
      referenceDate: baseDate,
    });
    expect(res.daysRemaining).toBe(0);
    expect(res.projectedDate).toEqual(baseDate);
  });

  it("projeta data e dias restantes com regressão válida", () => {
    const reg = {
      gmd: 1, // 1 kg/dia
      intercept: 400,
      r2: 0.98,
      refTimestamp: baseDate.getTime(),
    };

    const res = projectSlaughterDate({
      regression: reg,
      currentWeightKg: 400,
      targetWeightKg: 450,
      referenceDate: baseDate,
    });

    expect(res.daysRemaining).toBe(50);
    expect(res.projectedAdg).toBe(1);
    expect(res.confidenceR2).toBe(0.98);
    expect(res.projectedDate?.getTime()).toBe(baseDate.getTime() + 50 * DAY_MS);
  });
});

describe("computePastureStatus", () => {
  const baseDate = new Date("2026-06-01T00:00:00Z");

  it("classifica áreas em ocupadas, disponíveis e em descanso", () => {
    const areas = [
      {
        id: "area-1",
        name: "Pasto 1",
        hectares: 10,
        stockingRate: 1.5,
        defaultRestDays: 30,
      },
      {
        id: "area-2",
        name: "Pasto 2",
        hectares: 15,
        stockingRate: 1.2,
        defaultRestDays: 30,
      },
      {
        id: "area-3",
        name: "Pasto 3",
        hectares: 20,
        stockingRate: 1.0,
        defaultRestDays: 30,
      },
    ];

    const occupiedAreaIds = new Set(["area-1"]);
    const lastExitedMap = new Map([
      ["area-2", new Date(baseDate.getTime() - 40 * DAY_MS)], // 40 dias descansando >= 30 min -> DISPONÍVEL
      ["area-3", new Date(baseDate.getTime() - 10 * DAY_MS)], // 10 dias descansando < 30 min -> DESCANSO
    ]);

    const result = computePastureStatus(
      areas,
      occupiedAreaIds,
      lastExitedMap,
      baseDate,
    );

    expect(result.summary).toEqual({
      available: 1,
      occupied: 1,
      resting: 1,
      total: 3,
    });
    expect(result.readyPastures).toHaveLength(1);
    expect(result.readyPastures[0].id).toBe("area-2");
    expect(result.readyPastures[0].daysResting).toBe(40);
  });
});

describe("categorizeAnimal", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("categoriza bezerros, garrotes e adultos corretamente", () => {
    // 6 meses
    expect(
      categorizeAnimal(
        {
          sex: "MALE",
          neutered: false,
          birthDate: new Date("2025-12-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("Bezerros (< 1 ano)");

    // 18 meses
    expect(
      categorizeAnimal(
        {
          sex: "MALE",
          neutered: true,
          birthDate: new Date("2024-12-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("Garrotes (1 a 2 anos)");

    // Vaca adulta (> 2 anos)
    expect(
      categorizeAnimal(
        {
          sex: "FEMALE",
          neutered: false,
          birthDate: new Date("2023-01-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("Vacas (> 2 anos)");

    // Boi castrado adulto (> 2 anos)
    expect(
      categorizeAnimal(
        {
          sex: "MALE",
          neutered: true,
          birthDate: new Date("2023-01-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("Bois Castrados (> 2 anos)");

    // Touro inteiro (> 2 anos)
    expect(
      categorizeAnimal(
        {
          sex: "MALE",
          neutered: false,
          birthDate: new Date("2023-01-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("Touros Inteiros (> 2 anos)");
  });
});

describe("computeRotationAlerts", () => {
  const refDate = new Date("2026-06-01T00:00:00Z");

  it("identifica lotes que excederam o prazo máximo no pasto", () => {
    const items = [
      {
        batchId: "b1",
        batchName: "Lote 1",
        areaId: "a1",
        areaName: "Pasto 1",
        enteredAt: new Date(refDate.getTime() - 45 * DAY_MS),
        defaultOccupationDays: 30, // 45 > 30 -> excedeu em 15 dias
      },
      {
        batchId: "b2",
        batchName: "Lote 2",
        areaId: "a2",
        areaName: "Pasto 2",
        enteredAt: new Date(refDate.getTime() - 20 * DAY_MS),
        defaultOccupationDays: 30, // 20 <= 30 -> normal
      },
    ];

    const alerts = computeRotationAlerts(items, refDate);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].batchName).toBe("Lote 1");
    expect(alerts[0].daysExceeded).toBe(15);
  });
});

describe("computeBatchGoals", () => {
  const refDate = new Date("2026-06-01T00:00:00Z");

  it("classifica metas de venda em REACHED, ON_TRACK ou BEHIND", () => {
    const items = [
      {
        batchId: "b1",
        batchName: "Lote Meta Atingida",
        currentAnimalCount: 20,
        currentAvgWeightKg: 460,
        targetWeightKg: 450,
        targetDate: new Date(refDate.getTime() + 30 * DAY_MS),
        batchAdg: 1.0,
      },
      {
        batchId: "b2",
        batchName: "Lote No Caminho",
        currentAnimalCount: 20,
        currentAvgWeightKg: 420,
        targetWeightKg: 450,
        targetDate: new Date(refDate.getTime() + 30 * DAY_MS),
        batchAdg: 1.2, // precisa de 1.0 kg/dia ((450 - 420) / 30) -> 1.2 >= 0.9 -> ON_TRACK
      },
      {
        batchId: "b3",
        batchName: "Lote Atrasado",
        currentAnimalCount: 20,
        currentAvgWeightKg: 380,
        targetWeightKg: 450,
        targetDate: new Date(refDate.getTime() + 30 * DAY_MS),
        batchAdg: 0.5, // precisa de 2.33 kg/dia -> 0.5 < 2.1 -> BEHIND
      },
    ];

    const results = computeBatchGoals(items, refDate);
    expect(results[0].status).toBe("REACHED");
    expect(results[1].status).toBe("ON_TRACK");
    expect(results[2].status).toBe("BEHIND");
  });
});

describe("computeProductiveEfficiency", () => {
  it("calcula ganho em kg/ha/dia", () => {
    const res = computeProductiveEfficiency(1500, 50, 30);
    // 1500 / (50 * 30) = 1.0 kg/ha/dia
    expect(res.kgPerHaPerDay).toBe(1);
  });
});
