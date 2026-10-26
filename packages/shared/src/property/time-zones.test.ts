import { describe, expect, it } from "vitest";
import { propertySchema } from "./schema";
import { BR_TIME_ZONE_ITEMS, isBrTimeZone, timeZoneLabel } from "./time-zones";

// Deslocamento atual do fuso em relação ao UTC, como o rótulo escreve (ex.: "UTC−4").
function currentOffset(timeZone: string) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value;
  return name?.replace("GMT", "UTC").replace("-", "−");
}

describe("BR_TIME_ZONE_ITEMS", () => {
  it("cada fuso existe e tem no rótulo o deslocamento atual", () => {
    for (const { value, label } of BR_TIME_ZONE_ITEMS) {
      expect(label).toContain(`(${currentOffset(value)})`);
    }
  });

  it("reconhece só os fusos do Brasil", () => {
    expect(isBrTimeZone("America/Cuiaba")).toBe(true);
    expect(isBrTimeZone("Europe/Lisbon")).toBe(false);
    expect(timeZoneLabel("America/Cuiaba")).toBe("Mato Grosso (UTC−4)");
  });
});

describe("propertySchema (RN-PROPRIEDADE-04 e RN-PROPRIEDADE-05)", () => {
  const valid = {
    name: "Fazenda",
    ownerId: "x",
    latitude: "-15.5",
    longitude: "-55.8",
    timeZone: "America/Cuiaba",
  };

  it("aceita localização e fuso do Brasil", () => {
    expect(propertySchema.safeParse(valid).success).toBe(true);
  });

  it("exige latitude, longitude e um fuso do Brasil", () => {
    const fields = (data: object) =>
      propertySchema
        .safeParse({ ...valid, ...data })
        .error?.issues.map((issue) => issue.path[0]);
    expect(fields({ latitude: "" })).toEqual(["latitude"]);
    expect(fields({ longitude: "" })).toEqual(["longitude"]);
    expect(fields({ timeZone: "UTC" })).toEqual(["timeZone"]);
  });
});
