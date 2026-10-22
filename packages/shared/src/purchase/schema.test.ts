import { describe, expect, it } from "vitest";
import { purchaseCategorySchema, purchasePaymentSchema } from "./schema";

// O formulário de compra envia os valores como estão na tela (texto); estas regras valem
// igual na tela e na API.

const category = {
  sex: "MALE",
  expectedQuantity: "10",
  pricingType: "PER_HEAD",
  unitPrice: "2500",
  minAgeMonths: "",
  maxAgeMonths: "",
  breedId: "",
  totalPrice: "",
  invoicedWeight: "",
  shrinkPercent: "",
  costSplit: "EQUAL",
  notes: "",
} as const;

const firstIssue = (v: unknown) => {
  const r = purchaseCategorySchema.safeParse(v);
  return r.success ? null : r.error.issues[0];
};

describe("purchaseCategorySchema", () => {
  it("converte o formulário e descarta campos de outra forma de preço", () => {
    expect(
      purchaseCategorySchema.parse({ ...category, totalPrice: "9999" }),
    ).toMatchObject({
      expectedQuantity: 10,
      unitPrice: 2500,
      totalPrice: null,
      minAgeMonths: null,
      breedId: null,
      notes: null,
    });
  });

  it("exige o preço da forma escolhida", () => {
    expect(firstIssue({ ...category, unitPrice: "" })).toMatchObject({
      path: ["unitPrice"],
      message: "Informe o preço por cabeça",
    });
    expect(
      firstIssue({ ...category, pricingType: "LUMP_SUM", unitPrice: "" }),
    ).toMatchObject({ path: ["totalPrice"], message: "Informe o valor total" });
  });

  it("valida a quantidade", () => {
    expect(firstIssue({ ...category, expectedQuantity: "" })?.message).toBe(
      "Informe a quantidade",
    );
    expect(firstIssue({ ...category, expectedQuantity: "0" })?.message).toBe(
      "A quantidade deve ser ao menos 1",
    );
    expect(firstIssue({ ...category, expectedQuantity: "1.5" })?.message).toBe(
      "Informe um número inteiro",
    );
  });

  it("idade mínima não passa da máxima", () => {
    expect(
      firstIssue({ ...category, minAgeMonths: "24", maxAgeMonths: "12" }),
    ).toMatchObject({ path: ["maxAgeMonths"] });
  });
});

describe("purchasePaymentSchema", () => {
  it("data vazia é recusada; referência vazia vira null", () => {
    expect(purchasePaymentSchema.safeParse({ paymentDate: "" }).success).toBe(
      false,
    );
    expect(
      purchasePaymentSchema.parse({
        paymentDate: "2026-10-01",
        paymentReference: "",
      }),
    ).toEqual({ paymentDate: "2026-10-01", paymentReference: null });
  });
});
