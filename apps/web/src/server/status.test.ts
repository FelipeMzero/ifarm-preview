import { describe, expect, it } from "vitest";
import { toggledDeactivatedAt } from "./status";

describe("toggledDeactivatedAt", () => {
  const now = new Date("2026-10-19T12:00:00Z");

  it("desativa um registro ativo", () => {
    expect(toggledDeactivatedAt(null, now)).toBe(now);
  });

  it("reativa um registro desativado", () => {
    expect(toggledDeactivatedAt(new Date("2026-01-01"), now)).toBeNull();
  });
});
