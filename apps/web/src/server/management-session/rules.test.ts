import { describe, expect, it } from "vitest";
import {
  doseChangeBlocker,
  plannedDose,
  repeatedStepMessage,
  splitHandled,
  takenInSession,
} from "./rules";

describe("repeatedStepMessage", () => {
  it("aceita cada tipo uma vez e o sanitário repetido", () => {
    expect(
      repeatedStepMessage([
        { type: "weighing" },
        { type: "health" },
        { type: "health" },
      ]),
    ).toBeNull();
  });

  it("recusa tipo não repetível duas vezes", () => {
    expect(
      repeatedStepMessage([{ type: "weighing" }, { type: "weighing" }]),
    ).toBe('O manejo "Pesagem" só pode aparecer uma vez.');
  });
});

describe("splitHandled", () => {
  const participants = ["a", "b", "c"];
  const withRecords = new Set(["a", "c"]);

  it("separa quem tem registro de quem não tem", () => {
    expect(
      splitHandled(participants, (p) => withRecords.has(p), false),
    ).toEqual({ handled: ["a", "c"], notHandled: ["b"] });
  });

  it("na recepção todo participante conta como manejado", () => {
    expect(splitHandled(participants, () => false, true)).toEqual({
      handled: participants,
      notHandled: [],
    });
  });
});

describe("plannedDose", () => {
  it("sem dose, não grava dose nem peso de referência", () => {
    expect(
      plannedDose({ doseType: "NONE", doseMl: 5, doseWeightKg: 50 }),
    ).toEqual({ doseMl: null, doseWeightKg: null });
  });

  it("dose fixa grava só a dose", () => {
    expect(
      plannedDose({ doseType: "FIXED", doseMl: 5, doseWeightKg: 50 }),
    ).toEqual({ doseMl: 5, doseWeightKg: null });
  });

  it("dose por peso grava dose e peso de referência", () => {
    expect(
      plannedDose({ doseType: "PER_WEIGHT", doseMl: 1, doseWeightKg: 50 }),
    ).toEqual({ doseMl: 1, doseWeightKg: 50 });
  });
});

describe("doseChangeBlocker", () => {
  it("sem registros, qualquer troca vale", () => {
    expect(
      doseChangeBlocker({ doseType: "NONE", recordCount: 0 }, "FIXED"),
    ).toBeNull();
  });

  it("com registros, troca entre formas de dose vale", () => {
    expect(
      doseChangeBlocker({ doseType: "FIXED", recordCount: 3 }, "PER_WEIGHT"),
    ).toBeNull();
  });

  it("com registros, não inclui nem retira a dose", () => {
    expect(
      doseChangeBlocker({ doseType: "NONE", recordCount: 3 }, "FIXED"),
    ).toMatch(/3 animal\(is\): não é possível incluir a dose/);
    expect(
      doseChangeBlocker({ doseType: "FIXED", recordCount: 2 }, "NONE"),
    ).toMatch(/2 animal\(is\): não é possível retirar a dose/);
  });
});

describe("takenInSession", () => {
  const items = [
    { animalId: "a", value: "123" },
    { animalId: "b", value: null },
  ];

  it("acusa o valor registrado para outro animal", () => {
    expect(takenInSession(items, "b", "123")).toBe(true);
  });

  it("o próprio animal pode regravar o seu valor", () => {
    expect(takenInSession(items, "a", "123")).toBe(false);
    expect(takenInSession(items, "b", "999")).toBe(false);
  });
});
