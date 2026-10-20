import { describe, expect, it } from "vitest";
import { receiveAnimalSchema, sessionParticipantsSchema } from "./schema";

describe("receiveAnimalSchema", () => {
  it("aceita o que a tela de recepção envia", () => {
    expect(
      receiveAnimalSchema.parse({
        categoryId: 3,
        sex: "FEMALE",
        ageMonths: 18,
        name: "  Mimosa ",
      }),
    ).toEqual({ categoryId: 3, sex: "FEMALE", ageMonths: 18, name: "Mimosa" });
  });

  it("nome e idade são opcionais (nome vazio vira null)", () => {
    expect(receiveAnimalSchema.parse({ categoryId: 3, name: "" })).toEqual({
      categoryId: 3,
      name: null,
    });
  });

  it("idade fora de 0–360 meses é recusada", () => {
    expect(
      receiveAnimalSchema.safeParse({ categoryId: 3, ageMonths: 361 }).success,
    ).toBe(false);
    expect(
      receiveAnimalSchema.safeParse({ categoryId: 3, ageMonths: -1 }).success,
    ).toBe(false);
  });

  it("exige a categoria", () => {
    const result = receiveAnimalSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["categoryId"],
      message: "Escolha a categoria do animal.",
    });
  });
});

describe("sessionParticipantsSchema", () => {
  it("exige ao menos um animal", () => {
    expect(sessionParticipantsSchema.safeParse({ animalIds: [] }).success).toBe(
      false,
    );
  });
});
