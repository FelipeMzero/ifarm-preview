import { describe, expect, it } from "vitest";
import { fromDbDate, toDbDate } from "./db-dates";

describe("toDbDate / fromDbDate", () => {
  it("grava à meia-noite UTC, independente do fuso do servidor", () => {
    expect(toDbDate("1990-05-10").toISOString()).toBe(
      "1990-05-10T00:00:00.000Z",
    );
  });

  it("ida e volta preservam o dia", () => {
    expect(fromDbDate(toDbDate("1990-05-10"))).toBe("1990-05-10");
  });
});
