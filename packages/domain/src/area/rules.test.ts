import { describe, expect, it } from "vitest";
import type { AreaOccupancy } from "@ifarm/shared";
import { areaRotation, areaStatus } from "./rules";

const now = new Date("2026-10-20T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const occupancy = (o: Partial<AreaOccupancy> = {}): AreaOccupancy => ({
  batch: { id: "b1", name: "Lote 1" },
  occupiedSince: daysAgo(10),
  animalCount: 10,
  currentUa: 5,
  estimatedCount: 0,
  capacityUa: 10,
  exceeds: false,
  ...o,
});

type Area = Parameters<typeof areaRotation>[0];

const free: Area = {
  closedAt: null,
  defaultOccupationDays: 30,
  defaultRestDays: 20,
  occupancy: null,
  lastExitAt: null,
};

const statusOf = (area: Area) => areaStatus(area, areaRotation(area, now));

describe("areaRotation", () => {
  it("inativa não tem rodízio", () => {
    expect(areaRotation({ ...free, closedAt: daysAgo(1) }, now)).toBeNull();
  });

  it("ocupada: vence só depois dos dias de referência", () => {
    const at = (days: number) =>
      areaRotation(
        { ...free, occupancy: occupancy({ occupiedSince: daysAgo(days) }) },
        now,
      );
    expect(at(30)).toMatchObject({
      kind: "occupation",
      days: 30,
      overdue: false,
    });
    expect(at(31)).toMatchObject({ days: 31, overdue: true });
  });

  it("ocupada sem referência nunca vence", () => {
    expect(
      areaRotation(
        { ...free, defaultOccupationDays: null, occupancy: occupancy() },
        now,
      ),
    ).toMatchObject({ limit: null, overdue: false });
  });

  it("em descanso: pronta ao cumprir os dias, com a data prevista", () => {
    expect(areaRotation({ ...free, lastExitAt: daysAgo(19) }, now)).toEqual({
      kind: "rest",
      days: 19,
      since: daysAgo(19),
      limit: 20,
      ready: false,
      readyAt: daysAgo(-1),
    });
    expect(
      areaRotation({ ...free, lastExitAt: daysAgo(20) }, now),
    ).toMatchObject({ ready: true });
  });

  it("nunca ocupada: pronta se houver referência de descanso", () => {
    expect(areaRotation(free, now)).toMatchObject({
      kind: "rest",
      days: null,
      ready: true,
    });
    expect(areaRotation({ ...free, defaultRestDays: null }, now)).toMatchObject(
      { ready: false, readyAt: null },
    );
  });
});

describe("areaStatus", () => {
  it("ocupada: semáforo pela lotação", () => {
    const withUa = (currentUa: number, exceeds = false) =>
      statusOf({ ...free, occupancy: occupancy({ currentUa, exceeds }) });
    expect(withUa(7.9)).toBe("occupied");
    expect(withUa(8)).toBe("near");
    expect(withUa(10)).toBe("near");
    expect(withUa(10.1, true)).toBe("exceeded");
  });

  it("livre: descansada ou em descanso", () => {
    expect(statusOf({ ...free, lastExitAt: daysAgo(25) })).toBe("ready");
    expect(statusOf({ ...free, lastExitAt: daysAgo(5) })).toBe("free");
  });

  it("inativa", () => {
    expect(statusOf({ ...free, closedAt: daysAgo(1) })).toBe("inactive");
  });
});
