import { describe, expect, it } from "vitest";
import { toAnimalListParams, animalQuerySchema } from "./animal/schema";
import { toQueryString } from "./client";
import { personQuerySchema, type PersonListParams } from "./person/schema";
import {
  purchaseQuerySchema,
  type PurchaseListParams,
} from "./purchase/schema";

// Os parâmetros de listagem que o cliente monta vão pela URL (toQueryString) e o servidor
// os lê com o mesmo schema: a ida e a volta devem dar os mesmos valores.

// Lê a query string como o servidor (sem URLSearchParams, que não está nos tipos deste pacote).
const viaUrl = (params: Record<string, string | number | undefined>) =>
  Object.fromEntries(
    toQueryString(params)
      .split("&")
      .filter(Boolean)
      .map((pair) => pair.split("=").map(decodeURIComponent)),
  );

describe("parâmetros de listagem: cliente → URL → servidor", () => {
  it("pessoas", () => {
    const params: PersonListParams = {
      page: 2,
      pageSize: 20,
      type: "COMPANY",
      status: "inactive",
    };
    expect(personQuerySchema.parse(viaUrl(params))).toEqual({
      ...params,
      search: "",
    });
  });

  it("compras", () => {
    const params: PurchaseListParams = { status: "all", search: "boi" };
    expect(purchaseQuerySchema.parse(viaUrl(params))).toMatchObject(params);
  });

  it("animais, com pesos numéricos", () => {
    const params = toAnimalListParams({ minWeight: "300", sex: "FEMALE" });
    expect(animalQuerySchema.parse(viaUrl(params))).toMatchObject({
      minWeight: 300,
      sex: "FEMALE",
    });
  });
});

describe("toAnimalListParams", () => {
  it("vazio = sem filtro; pesos viram número", () => {
    expect(
      toAnimalListParams({
        status: "",
        batchId: "none",
        minWeight: "250",
        maxWeight: "",
      }),
    ).toMatchObject({
      status: undefined,
      batchId: "none",
      minWeight: 250,
      maxWeight: undefined,
    });
  });

  it("filtro inválido fica de fora, os demais continuam", () => {
    const params = toAnimalListParams({ minWeight: "abc", sex: "MALE" });
    expect(params.minWeight).toBeUndefined();
    expect(params.sex).toBe("MALE");
  });
});
