import type { AreaOccupancy } from "../stocking/types";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type AreaRow = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polygon: any;
  hectares: number;
  stockingRate: number;
  defaultOccupationDays: number | null;
  defaultRestDays: number | null;
  notes: string | null;
  propertyId: string;
  closedAt: string | null;
  updatedAt: string;
  /** Lote que ocupa a área hoje; null quando livre. */
  occupancy: AreaOccupancy | null;
  /** Saída do último lote (início do descanso); null se nunca foi ocupada. */
  lastExitAt: string | null;
  /** Situação no mapa (lotação e descanso), calculada pelo servidor. */
  status: AreaStatus;
  /** Rodízio da área hoje; null quando inativa. */
  rotation: AreaRotation | null;
};

// Ocupadas: pela lotação (até 80% da capacidade, até 100%, acima). Livres: "ready"
// quando já cumpriram os dias de descanso de referência.
export type AreaStatus =
  "free" | "ready" | "occupied" | "near" | "exceeded" | "inactive";

// Rodízio da área: há quanto tempo está ocupada ou em descanso, comparado com os dias
// de referência cadastrados. Sem referência, só a contagem de dias é informada.
export type AreaRotation =
  | {
      kind: "occupation";
      days: number;
      since: string;
      limit: number | null;
      overdue: boolean;
    }
  | {
      kind: "rest";
      /** null quando a área nunca foi ocupada. */
      days: number | null;
      since: string | null;
      limit: number | null;
      ready: boolean;
      /** Quando cumpre o descanso de referência (ISO); null sem referência ou nunca ocupada. */
      readyAt: string | null;
    };

export type AreaOccupancyHistoryEntry = {
  id: number;
  batch: { id: string; name: string };
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};
