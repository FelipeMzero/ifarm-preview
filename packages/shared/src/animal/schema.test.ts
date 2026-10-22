import { describe, expect, it } from "vitest";
import { animalCreateSchema, weighingCorrectionSchema } from "./schema";

// Os formulários de animal validam com estes schemas: as regras abaixo valem igual na tela
// e na API.

const base = { sex: "MALE", origin: "BIRTH", batchId: "lote-1" } as const;

describe("animalCreateSchema", () => {
  it("aceita o formulário com campos vazios e converte para a API", () => {
    const r = animalCreateSchema.parse({
      ...base,
      currentTag: "",
      currentWeightKg: "320.5",
      birthDate: "",
    });
    expect(r).toMatchObject({
      currentTag: null,
      currentWeightKg: 320.5,
      birthDate: null,
      neutered: false,
    });
  });

  it("compra exige vendedor e preço", () => {
    const r = animalCreateSchema.safeParse({ ...base, origin: "PURCHASE" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      "purchasePrice",
      "sellerId",
    ]);
  });

  it("recusa data em formato inválido", () => {
    expect(
      animalCreateSchema.safeParse({ ...base, birthDate: "10/05/2024" })
        .success,
    ).toBe(false);
  });
});

describe("weightKg (correção de pesagem)", () => {
  const weight = (v: unknown) => {
    const r = weighingCorrectionSchema.safeParse({ weightKg: v });
    return r.success ? r.data.weightKg : r.error.issues[0].message;
  };

  it("aceita texto do formulário ou número", () => {
    expect(weight("320.5")).toBe(320.5);
    expect(weight(320)).toBe(320);
  });

  it("recusa vazio, inválido e não positivo", () => {
    expect(weight("")).toBe("Este campo não pode ser vazio");
    expect(weight("abc")).toBe("Informe um peso válido");
    expect(weight("0")).toBe("O peso deve ser maior que zero");
  });
});
