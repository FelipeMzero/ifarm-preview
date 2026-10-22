import { describe, expect, it } from "vitest";
import { batchCreateSchema, batchUpdateSchema } from "./schema";

// O formulário de lote valida com estas regras: valem igual na tela e na API.

const AREA = "6f1c2a4e-8b7d-4c3a-9e2f-1a2b3c4d5e6f";
const fields = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) => r.error?.issues.map((i) => i.path[0]).sort() ?? [];

describe("meta de venda (RN-LOTE-04)", () => {
  it("sem meta, data e peso são dispensados", () => {
    const r = batchCreateSchema.safeParse({ name: "Engorda", areaId: AREA });
    expect(r.success).toBe(true);
  });

  it("com meta, exige data e peso (criação e edição)", () => {
    const meta = {
      name: "Engorda",
      hasMeta: true,
      targetDate: "",
      targetWeight: "",
    };
    expect(
      fields(batchCreateSchema.safeParse({ ...meta, areaId: AREA })),
    ).toEqual(["targetDate", "targetWeight"]);
    expect(fields(batchUpdateSchema.safeParse(meta))).toEqual([
      "targetDate",
      "targetWeight",
    ]);
  });

  it("o peso da meta precisa ser maior que zero", () => {
    const r = batchUpdateSchema.safeParse({
      name: "Engorda",
      hasMeta: true,
      targetDate: "2026-12-01",
      targetWeight: "0",
    });
    expect(r.error?.issues[0]).toMatchObject({
      path: ["targetWeight"],
      message: "O peso deve ser maior que zero",
    });
  });

  it("meta completa é convertida para a API", () => {
    expect(
      batchUpdateSchema.parse({
        name: "Engorda",
        hasMeta: true,
        targetDate: "2026-12-01",
        targetWeight: "520.5",
      }),
    ).toMatchObject({
      hasMeta: true,
      targetDate: "2026-12-01",
      targetWeight: 520.5,
    });
  });
});
