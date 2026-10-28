// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type PropertyRow = {
  id: string;
  name: string;
  totalArea: number | null;
  city: string | null;
  state: string | null;
  ownerName: string;
  deactivatedAt: string | null;
  updatedAt: string;
};

export type PropertyListResult = {
  data: PropertyRow[];
  total: number;
  pageCount: number;
};

export type PropertyOption = { id: string; name: string };
