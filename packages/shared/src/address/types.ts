// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

/** Endereço encontrado pelo CEP. */
export type ZipCodeAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type Coordinates = { latitude: number; longitude: number };
