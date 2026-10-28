import type { PersonType } from "../enums";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type PersonRow = {
  id: string;
  type: PersonType;
  taxId: string;
  name: string;
  phone: string | null;
  email: string | null;
  deactivatedAt: string | null;
  updatedAt: string;
};

export type PersonListResult = {
  data: PersonRow[];
  total: number;
  pageCount: number;
};
