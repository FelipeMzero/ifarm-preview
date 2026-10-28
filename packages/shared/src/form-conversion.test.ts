import { describe, expect, it } from "vitest";
import { areaSchema } from "./area/schema";
import { personSchema } from "./person/schema";
import { propertySchema } from "./property/schema";

// Os schemas recebem os dados como o formulário os envia (números como texto, "" para vazio) e
// entregam à API já convertidos.

const area = {
  name: "Piquete 1",
  polygon: [{ lat: -15, lng: -56 }],
  hectares: "12.5",
  stockingRate: "2",
  defaultOccupationDays: "",
  defaultRestDays: "30",
  notes: "",
  propertyId: "44d64a49-6a31-4c81-ad90-20d44fb2bc8e",
};

const property = {
  name: "Fazenda",
  ownerId: "o1",
  totalArea: "100",
  productiveArea: "",
  cib: "",
  latitude: "-15.6",
  longitude: "-56.1",
  timeZone: "America/Cuiaba",
};

describe("área: números do formulário", () => {
  it("converte texto em número e vazio em null", () => {
    expect(areaSchema.parse(area)).toMatchObject({
      hectares: 12.5,
      stockingRate: 2,
      defaultOccupationDays: null,
      defaultRestDays: 30,
      notes: null,
    });
  });

  it("aceita números já convertidos (ex.: o mobile)", () => {
    expect(areaSchema.parse({ ...area, hectares: 8 }).hectares).toBe(8);
  });

  it("recusa vazio no obrigatório e texto que não é número", () => {
    const error = (input: object) =>
      areaSchema.safeParse({ ...area, ...input }).error?.issues[0]?.message;
    expect(error({ hectares: "" })).toBe("Este campo é obrigatório");
    expect(error({ hectares: "abc" })).toBe("Valor inválido.");
    expect(error({ defaultRestDays: "2.5" })).toBe(
      "Informe um número inteiro de dias.",
    );
  });
});

describe("propriedade: números do formulário", () => {
  it("converte as áreas e as coordenadas; vazio vira null", () => {
    expect(propertySchema.parse(property)).toMatchObject({
      totalArea: 100,
      productiveArea: null,
      cib: null,
      latitude: -15.6,
      longitude: -56.1,
    });
  });

  it("RN-PROPRIEDADE-03: área produtiva maior que a total", () => {
    const result = propertySchema.safeParse({
      ...property,
      productiveArea: "150",
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["productiveArea"],
      message: "A área produtiva não pode ser maior que a área total.",
    });
  });
});

describe("pessoa: campos opcionais do formulário", () => {
  it("vazio vira null; preenchido fica como está", () => {
    expect(
      personSchema.parse({
        type: "INDIVIDUAL",
        taxId: "529.982.247-25",
        name: "Maria",
        stateRegistration: "",
        phone: "(65) 99999-0000",
        email: "",
        rg: "",
        birthDate: "",
        maritalStatus: "",
      }),
    ).toMatchObject({
      stateRegistration: null,
      phone: "(65) 99999-0000",
      email: null,
      rg: null,
      birthDate: null,
      maritalStatus: null,
    });
  });
});
