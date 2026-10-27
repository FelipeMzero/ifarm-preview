import { describe, expect, it } from "vitest";
import {
  dateField,
  dateTimeField,
  dayInZone,
  formatDateTime,
  formatDay,
  fromLocalDay,
  instantToZonedIso,
  toDateTimeInput,
  toLocalDay,
  zonedDateTimeToInstant,
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

describe("formatDay", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatDay("1990-05-10")).toBe("10/05/1990");
    expect(formatDay(null)).toBe("—");
  });

  it("mostra o dia da propriedade, e não o do UTC", () => {
    // 22:00 em Cuiabá já é dia 27 em UTC.
    expect(formatDay("2026-10-26T22:00:00-04:00")).toBe("26/10/2026");
  });
});

describe("toLocalDay / fromLocalDay", () => {
  it("grava à meia-noite local e a ida e volta preservam o dia", () => {
    const d = toLocalDay("2026-05-10");
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    expect(fromLocalDay(d)).toBe("2026-05-10");
  });
});

describe("dateTimeField", () => {
  it("aceita AAAA-MM-DDTHH:mm e rejeita o resto", () => {
    expect(dateTimeField.safeParse("2026-05-10T14:30").success).toBe(true);
    expect(dateTimeField.safeParse("2026-05-10").success).toBe(false);
    expect(dateTimeField.safeParse("2026-02-30T10:00").success).toBe(false);
    expect(dateTimeField.safeParse("2026-05-10T25:00").success).toBe(false);
    expect(dateTimeField.safeParse("2026-05-10T10:60").success).toBe(false);
  });
});

describe("data e hora no fuso da propriedade", () => {
  it("a hora digitada vale no fuso informado", () => {
    expect(
      zonedDateTimeToInstant(
        "2026-10-26T08:00",
        "America/Cuiaba",
      ).toISOString(),
    ).toBe("2026-10-26T12:00:00.000Z");
    expect(
      zonedDateTimeToInstant(
        "2026-10-26T08:00",
        "America/Sao_Paulo",
      ).toISOString(),
    ).toBe("2026-10-26T11:00:00.000Z");
  });

  it("a resposta traz a hora do fuso e o deslocamento", () => {
    const instant = new Date("2026-10-26T12:00:00Z");
    expect(instantToZonedIso(instant, "America/Cuiaba")).toBe(
      "2026-10-26T08:00:00-04:00",
    );
    expect(instantToZonedIso(instant, "America/Sao_Paulo")).toBe(
      "2026-10-26T09:00:00-03:00",
    );
    expect(instantToZonedIso(instant, "UTC")).toBe("2026-10-26T12:00:00+00:00");
  });

  it("mantém os milissegundos do instante, quando há", () => {
    const instant = new Date("2026-10-25T19:20:11.072Z");
    expect(instantToZonedIso(instant, "America/Sao_Paulo")).toBe(
      "2026-10-25T16:20:11.072-03:00",
    );
    expect(Date.parse(instantToZonedIso(instant, "America/Cuiaba"))).toBe(
      instant.getTime(),
    );
  });

  it("segue o horário de verão de quando o instante aconteceu", () => {
    // São Paulo teve horário de verão (UTC−2) até 2019.
    const summer = zonedDateTimeToInstant(
      "2018-12-01T08:00",
      "America/Sao_Paulo",
    );
    expect(summer.toISOString()).toBe("2018-12-01T10:00:00.000Z");
    expect(instantToZonedIso(summer, "America/Sao_Paulo")).toBe(
      "2018-12-01T08:00:00-02:00",
    );
  });

  it("ida e volta preservam a hora digitada", () => {
    for (const timeZone of ["America/Cuiaba", "America/Rio_Branco"]) {
      const iso = instantToZonedIso(
        zonedDateTimeToInstant("2026-03-01T23:45", timeZone),
        timeZone,
      );
      expect(toDateTimeInput(iso)).toBe("2026-03-01T23:45");
    }
  });

  it("o dia de um instante depende do fuso da propriedade", () => {
    const instant = new Date("2026-10-27T03:30:00Z");
    expect(dayInZone(instant, "America/Sao_Paulo")).toBe("2026-10-27");
    expect(dayInZone(instant, "America/Cuiaba")).toBe("2026-10-26");
  });

  it("instante do sistema (UTC) aparece no fuso de quem vê", () => {
    const instant = new Date("2026-10-26T12:00:00.000Z");
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(toDateTimeInput(instant.toISOString())).toBe(
      `${fromLocalDay(instant)}T${pad(instant.getHours())}:${pad(instant.getMinutes())}`,
    );
  });

  it("formata como vem, sem converter para o fuso de quem vê", () => {
    expect(formatDateTime("2026-10-26T08:00:00-04:00")).toBe(
      "26/10/2026 às 08:00",
    );
    expect(formatDateTime("2026-05-10T00:00")).toBe("10/05/2026 às 00:00");
    expect(formatDateTime("2026-05-10")).toBe("10/05/2026");
    expect(formatDateTime(undefined)).toBe("—");
  });
});
