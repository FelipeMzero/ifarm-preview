import { describe, expect, it } from "vitest";
import { animalUnits, capacityCheck, sumUnits, UA_KG } from "./rules";
import { toDbDate } from "@/server/db-dates";

const now = new Date("2026-10-19T12:00:00Z");
const base = { currentWeight: null, birthDate: null, neutered: false } as const;

describe("animalUnits", () => {
  it("usa o peso quando houver", () => {
    expect(
      animalUnits({ ...base, sex: "FEMALE", currentWeight: UA_KG }, now),
    ).toEqual({ ua: 1, estimated: false });
  });

  it("estima pela idade sem peso", () => {
    const at = (birth: string, sex: "MALE" | "FEMALE", neutered = false) =>
      animalUnits({ ...base, sex, neutered, birthDate: toDbDate(birth) }, now)
        .ua;
    expect(at("2026-01-01", "FEMALE")).toBe(0.4);
    expect(at("2025-01-01", "FEMALE")).toBe(0.75);
    expect(at("2020-01-01", "FEMALE")).toBe(1);
    expect(at("2020-01-01", "MALE")).toBe(1.25);
    expect(at("2020-01-01", "MALE", true)).toBe(1);
  });

  it("conta a idade em meses pelo dia gravado, sem depender do fuso", () => {
    // Nascido em 1º/10/2025: 12 meses em 19/10/2026, ainda na faixa até 12 meses.
    expect(
      animalUnits(
        { ...base, sex: "FEMALE", birthDate: toDbDate("2025-10-01") },
        now,
      ).ua,
    ).toBe(0.4);
  });

  it("sem peso nem idade conta 1 UA", () => {
    expect(animalUnits({ ...base, sex: "MALE" }, now)).toEqual({
      ua: 1,
      estimated: true,
    });
  });
});

describe("sumUnits", () => {
  it("soma UA, quantidade e estimados", () => {
    expect(
      sumUnits(
        [
          { ...base, sex: "FEMALE", currentWeight: 900 },
          { ...base, sex: "MALE" },
        ],
        now,
      ),
    ).toEqual({ ua: 3, count: 2, estimatedCount: 1 });
  });
});

describe("capacityCheck", () => {
  it("capacidade é hectares × taxa de lotação", () => {
    expect(capacityCheck({ hectares: 10, stockingRate: 1.5 }, 15)).toEqual({
      capacityUa: 15,
      exceeds: false,
    });
  });

  it("excede só acima da capacidade", () => {
    expect(
      capacityCheck({ hectares: 10, stockingRate: 1.5 }, 15.1).exceeds,
    ).toBe(true);
  });
});
