import { describe, expect, it } from "vitest";
import {
  batchPayloadSchema,
  healthPayloadSchemaFor,
  identifierPayloadSchemaFor,
  neuteringPayloadSchema,
  weighingPayloadSchema,
} from "./step-payloads";

// As telas de registro enviam os valores como estão no formulário (texto); os módulos de
// etapa do servidor validam com os mesmos schemas.

const issue = (r: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) => (r.success ? null : r.error!.issues[0].message);

describe("pesagem", () => {
  it("converte o peso digitado", () => {
    expect(
      weighingPayloadSchema.parse({ weightKg: "412.5", notes: "" }),
    ).toEqual({
      weightKg: 412.5,
      notes: null,
    });
  });

  it("recusa vazio, zero e acima do limite", () => {
    expect(issue(weighingPayloadSchema.safeParse({ weightKg: "" }))).toBe(
      "Informe o peso",
    );
    expect(issue(weighingPayloadSchema.safeParse({ weightKg: "0" }))).toBe(
      "O peso deve ser maior que zero",
    );
    expect(issue(weighingPayloadSchema.safeParse({ weightKg: "3001" }))).toBe(
      "Peso acima do limite (3000 kg)",
    );
  });
});

describe("brinco e RFID", () => {
  it("exige valor e respeita o tamanho do tipo", () => {
    expect(
      issue(identifierPayloadSchemaFor("tag").safeParse({ value: "  " })),
    ).toBe("Este campo é obrigatório");
    expect(
      identifierPayloadSchemaFor("rfid").parse({ value: " 982000123 " }).value,
    ).toBe("982000123");
  });
});

describe("castração", () => {
  it("exige a técnica", () => {
    expect(issue(neuteringPayloadSchema.safeParse({ techniqueId: "" }))).toBe(
      "Informe a técnica.",
    );
  });
});

describe("sanitário", () => {
  it("sem dose no procedimento, a dose é opcional", () => {
    expect(
      healthPayloadSchemaFor(false).parse({ doseMl: "" }).doseMl,
    ).toBeNull();
  });

  it("com dose no procedimento, a dose aplicada é obrigatória e positiva", () => {
    expect(issue(healthPayloadSchemaFor(true).safeParse({ doseMl: "" }))).toBe(
      "Informe a dose aplicada.",
    );
    expect(issue(healthPayloadSchemaFor(true).safeParse({ doseMl: "0" }))).toBe(
      "A dose deve ser maior que zero",
    );
    expect(healthPayloadSchemaFor(true).parse({ doseMl: "5" }).doseMl).toBe(5);
  });
});

describe("apartação", () => {
  it("vazio ou null = permanecer no lote atual", () => {
    expect(batchPayloadSchema.parse({ batchId: "" }).batchId).toBeNull();
    expect(batchPayloadSchema.parse({ batchId: null }).batchId).toBeNull();
  });

  it("aceita só um lote válido", () => {
    expect(batchPayloadSchema.safeParse({ batchId: "lote-1" }).success).toBe(
      false,
    );
  });
});
