import { describe, expect, it } from "vitest";
import { planStepSchema } from "./plan-steps";

// Etapas do planejamento, como a API recebe (sessões e recepções): o `type` escolhe o
// schema de cada etapa.

const TYPE_ID = "6f1c2a4e-8b7d-4c3a-9e2f-1a2b3c4d5e6f";
const issues = (v: unknown) => {
  const r = planStepSchema.safeParse(v);
  return r.success
    ? []
    : r.error.issues.map((i) => [i.path.join("."), i.message]);
};

describe("planStepSchema", () => {
  it("etapas sem configuração", () => {
    expect(planStepSchema.parse({ type: "weighing" })).toEqual({
      type: "weighing",
    });
    expect(planStepSchema.parse({ type: "rfid" })).toEqual({ type: "rfid" });
  });

  it("recusa tipo desconhecido", () => {
    expect(issues({ type: "vacina" })[0][0]).toBe("type");
  });

  it("apartação e castração têm valores padrão", () => {
    expect(planStepSchema.parse({ type: "batch" })).toEqual({
      type: "batch",
      suggestedBatchIds: [],
    });
    expect(planStepSchema.parse({ type: "neutering" })).toEqual({
      type: "neutering",
      suggestedTechniqueId: null,
    });
  });
});

describe("sanitário", () => {
  it("exige o tipo do procedimento", () => {
    expect(issues({ type: "health" })).toEqual([
      ["typeId", "Selecione o tipo do procedimento."],
    ]);
  });

  it("com dose, exige a dose; por peso, também o peso de referência", () => {
    expect(
      issues({ type: "health", typeId: TYPE_ID, doseType: "FIXED" }),
    ).toEqual([["doseMl", "Informe a dose."]]);
    expect(
      issues({
        type: "health",
        typeId: TYPE_ID,
        doseType: "PER_WEIGHT",
        doseMl: "1",
      }),
    ).toEqual([["doseWeightKg", "Informe o peso de referência."]]);
  });

  it("converte o formulário e mantém as datas como dia (o servidor grava no banco)", () => {
    expect(
      planStepSchema.parse({
        type: "health",
        typeId: TYPE_ID,
        title: "",
        veterinarianId: "",
        doseType: "PER_WEIGHT",
        doseMl: "1",
        doseWeightKg: "50",
        withdrawalEndDate: "2026-11-01",
        nextDueDate: "",
      }),
    ).toEqual({
      type: "health",
      typeId: TYPE_ID,
      title: null,
      veterinarianId: null,
      doseType: "PER_WEIGHT",
      doseMl: 1,
      doseWeightKg: 50,
      withdrawalEndDate: "2026-11-01",
      nextDueDate: null,
    });
  });

  it("recusa data em formato inválido", () => {
    expect(
      issues({
        type: "health",
        typeId: TYPE_ID,
        withdrawalEndDate: "01/11/2026",
      })[0],
    ).toEqual(["withdrawalEndDate", "Informe uma data válida."]);
  });
});
