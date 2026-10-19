import { describe, expect, it } from "vitest";
import {
  dateField,
  formatDate,
  fromDbDate,
  fromLocalDay,
  toDbDate,
  toLocalDay,
} from "./date";

describe("dateField", () => {
  it("aceita AAAA-MM-DD, vazio e ausente", () => {
    expect(dateField.safeParse("1990-05-10").success).toBe(true);
    expect(dateField.safeParse("").success).toBe(true);
    expect(dateField.safeParse(undefined).success).toBe(true);
  });

  it("rejeita outros formatos e datas inexistentes", () => {
    expect(dateField.safeParse("10/05/1990").success).toBe(false);
    expect(dateField.safeParse("1990-02-30").success).toBe(false);
  });
});

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

describe("formatDate", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatDate("1990-05-10")).toBe("10/05/1990");
  });
});

describe("toLocalDay / fromLocalDay", () => {
  it("grava à meia-noite local e a ida e volta preservam o dia", () => {
    const d = toLocalDay("2026-05-10");
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    expect(fromLocalDay(d)).toBe("2026-05-10");
  });
});
