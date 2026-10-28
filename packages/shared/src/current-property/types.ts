import type { BrTimeZone } from "../property/time-zones";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

/** A propriedade em que o usuário está trabalhando, com o fuso dela (RN-PROPRIEDADE-05). */
export type CurrentProperty = {
  id: string;
  name: string;
  timeZone: BrTimeZone;
};

export type CurrentPropertyDetails = {
  id: string;
  name: string;
  ownerName: string;
  totalArea: number | null;
  productiveArea: number | null;
  city: string | null;
  state: string | null;
};
