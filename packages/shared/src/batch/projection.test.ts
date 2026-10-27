import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BatchDetailAnimal } from "./client";
import { DAY_MS } from "../date";
import { projectBatch } from "./projection";

const today = new Date(2026, 9, 20); // meia-noite local
const inDays = (n: number) => new Date(today.getTime() + n * DAY_MS);

const animal = (
  currentWeightKg: number | null,
  adgKgPerDay: number | null,
): BatchDetailAnimal => ({
  id: String(currentWeightKg),
  code: 1,
  earTag: null,
  rfid: null,
  name: null,
  sex: "MALE",
  neutered: false,
  birthDate: null,
  breedName: null,
  currentWeightKg,
  lastWeighingDate: currentWeightKg != null ? today.toISOString() : null,
  adgKgPerDay,
  enteredAt: null,
});

// Pesados hoje: 300 kg com GMD 1 e 340 kg sem GMD próprio (usa a média do lote).
const herd = [animal(300, 1), animal(340, null)];
const goal = { targetDate: "2026-11-19", targetWeightKg: 350 }; // 30 dias

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 20, 10, 0));
});
afterEach(() => vi.useRealTimers());

describe("projectBatch", () => {
  it("no ritmo: chega à meta na data com o GMD medido", () => {
    const p = projectBatch(herd, goal);
    expect(p).toMatchObject({
      weighedCount: 2,
      unweighedCount: 0,
      measuredAdg: 1,
      measuredAdgCount: 1,
      adg: 1,
      projectedTodayKg: 320,
      daysLeft: 30,
      reached: false,
      onTrack: true,
      animalsAtTarget: 0,
    });
    expect(p.projectedAtTargetKg).toBeCloseTo(350, 0);
    expect(p.requiredAdg).toBe(1);
    expect(p.estimatedDate).toEqual(inDays(30));
  });

  it("GMD simulado substitui o medido de todos os animais", () => {
    const p = projectBatch(herd, goal, 0.5);
    expect(p.adg).toBe(0.5);
    expect(p.projectedAtTargetKg).toBeCloseTo(335, 0);
    expect(p.onTrack).toBe(false);
    expect(p.estimatedDate).toEqual(inDays(60));
    // O GMD necessário não depende da simulação.
    expect(p.requiredAdg).toBe(1);
  });

  it("meta já atingida: hoje, sem GMD necessário", () => {
    const p = projectBatch(herd, { ...goal, targetWeightKg: 300 });
    expect(p).toMatchObject({
      reached: true,
      onTrack: true,
      requiredAdg: null,
      animalsAtTarget: 2,
    });
    expect(p.estimatedDate).toEqual(today);
  });

  it("sem GMD: só o peso médio atual, sem projeção", () => {
    const p = projectBatch([animal(300, null), animal(340, null)], goal);
    expect(p).toMatchObject({
      adg: null,
      projectedTodayKg: 320,
      projectedAtTargetKg: null,
      estimatedDate: null,
      onTrack: null,
    });
    expect(p.projectAt(inDays(10))).toBeNull();
  });

  it("animais sem pesagem ficam fora da média", () => {
    const p = projectBatch([...herd, animal(null, null)], goal);
    expect(p.weighedCount).toBe(2);
    expect(p.unweighedCount).toBe(1);
    expect(p.projectedTodayKg).toBe(320);
  });

  it("sem meta: nada a comparar", () => {
    const p = projectBatch(herd, null);
    expect(p).toMatchObject({
      targetWeightKg: null,
      daysLeft: null,
      requiredAdg: null,
      estimatedDate: null,
      onTrack: null,
      animalsAtTarget: 0,
    });
  });
});
