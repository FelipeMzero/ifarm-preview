// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type UaTotal = { ua: number; count: number; estimatedCount: number };

export type StockingPreview = {
  area: { id: string; name: string };
  capacityUa: number;
  current: UaTotal;
  incoming: UaTotal;
  projectedUa: number;
  exceeds: boolean;
};

export type AreaOccupancy = {
  batch: { id: string; name: string };
  /** Entrada do lote atual na área (início do período de ocupação). */
  occupiedSince: string;
  animalCount: number;
  currentUa: number;
  estimatedCount: number;
  capacityUa: number;
  exceeds: boolean;
};
