import { describe, expect, it } from "vitest";
import { toggledDeactivatedAt, withoutImmutableFields } from "./rules";

describe("withoutImmutableFields (RN-PESSOA-02)", () => {
  it("remove tipo e documento e mantém os demais campos", () => {
    const data = { type: "COMPANY", taxId: "123", name: "Fazenda", rg: null };
    expect(withoutImmutableFields(data)).toEqual({ name: "Fazenda", rg: null });
  });
});

describe("toggledDeactivatedAt", () => {
  const now = new Date("2026-10-19T12:00:00Z");

  it("desativa uma pessoa ativa", () => {
    expect(toggledDeactivatedAt(null, now)).toBe(now);
  });

  it("reativa uma pessoa desativada", () => {
    expect(toggledDeactivatedAt(new Date("2026-01-01"), now)).toBeNull();
  });
});
