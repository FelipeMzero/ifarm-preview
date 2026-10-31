import type { PropertyZoneRef } from "../property/time-zones";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type AnimalRow = {
  id: string;
  code: number;
  rfid: string | null;
  earTag: string | null;
  currentTag: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  birthWeightKg: number | null;
  origin: string;
  status: string;
  currentWeightKg: number | null;
  currentBatch: { id: string; name: string } | null;
  updatedAt: string;
};

export type AnimalDetail = {
  id: string;
  currentTag: string | null;
  currentRfid: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  breedId: string | null;
  breedName: string | null;
  origin: string;
  status: string;
  neutered: boolean;
  neuteredAt: string | null;
  currentBatchId: string | null;
  currentBatchName: string | null;
  currentProperty: PropertyZoneRef;
  currentWeightKg: number | null;
  updatedAt: string;
};

export type AnimalListResult = {
  data: AnimalRow[];
  total: number;
  pageCount: number;
};

export type AnimalWeighing = {
  id: number;
  date: string;
  weightKg: number;
  notes: string | null;
  fromSession: boolean;
  correctedAt: string | null;
  /** Versões anteriores, da mais recente para a original. */
  previousVersions: {
    recordedAt: string;
    date: string;
    weightKg: number;
    notes: string | null;
  }[];
};

export type AnimalIdentifierHistory = {
  id: number;
  date: string;
  value: string | null;
  notes: string | null;
};

export type AnimalNeutering = {
  id: number;
  date: string;
  techniqueName: string | null;
  notes: string | null;
  correctedAt: string | null;
};

export type AnimalNeuteringRecord = AnimalNeutering & {
  fromSession: boolean;
  techniqueId: string | null;
  /** Versões anteriores, da mais recente para a original. */
  previousVersions: {
    recordedAt: string;
    date: string;
    techniqueId: string | null;
    techniqueName: string | null;
    notes: string | null;
  }[];
};

export type AnimalHealthRecord = {
  id: number;
  date: string;
  typeName: string;
  title: string | null;
  veterinarianName: string | null;
  withdrawalEndDate: string | null;
  nextDueDate: string | null;
  doseMl: number | null;
  notes: string | null;
};

export type AnimalBatchHistoryEntry = {
  id: number;
  batchId: string | null;
  batchName: string | null;
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

export type AnimalPropertyHistoryEntry = {
  id: number;
  propertyId: string;
  propertyName: string;
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

export type AnimalPurchase = {
  date: string;
  sellerId: string;
  sellerName: string;
  pricingType: string;
  pricePerArroba: number | null;
  totalPrice: number | null;
  cost: number | null;
  weightKg: number | null;
  gtaNumber: string | null;
  notes: string | null;
};

export type AnimalFullDetails = {
  id: string;
  code: number;
  currentTag: string | null;
  currentRfid: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  /** Idade informada (ex.: compra), sem registro de nascimento. */
  birthDateEstimated: boolean;
  breedName: string | null;
  origin: string;
  status: string;
  neutered: boolean;
  currentBatch: { id: string; name: string } | null;
  currentProperty: { id: string; name: string };
  currentWeightKg: number | null;
  createdAt: string;
  updatedAt: string;
  weighings: AnimalWeighing[];
  tagHistory: AnimalIdentifierHistory[];
  rfidHistory: AnimalIdentifierHistory[];
  neutering: AnimalNeutering[];
  health: AnimalHealthRecord[];
  batchHistory: AnimalBatchHistoryEntry[];
  propertyHistory: AnimalPropertyHistoryEntry[];
  purchase: AnimalPurchase | null;
};

export type IdentifierKind = "tag" | "rfid";

// Registro do histórico de brinco/RFID (value null = identificador removido).
export type AnimalIdentifierRecord = {
  id: number;
  date: string;
  value: string | null;
  notes: string | null;
  fromSession: boolean;
  correctedAt: string | null;
  /** Versões anteriores, da mais recente para a original. */
  previousVersions: {
    recordedAt: string;
    date: string;
    value: string | null;
    notes: string | null;
  }[];
};
