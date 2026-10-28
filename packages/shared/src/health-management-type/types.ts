// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type HealthManagementType = {
  id: string;
  name: string;
  deactivatedAt: string | null;
};
