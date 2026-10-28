// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type BatchRow = {
  id: string;
  name: string;
  notes: string | null;
  hasMeta: boolean;
  targetDate: string | null;
  targetWeight: number | null;
  area: { id: string; name: string } | null;
  animalCount: number;
  avgWeightKg: number | null;
  closedAt: string | null;
  updatedAt: string;
};

export type BatchDetail = {
  id: string;
  name: string;
  notes: string;
  hasMeta: boolean;
  targetDate: string | null;
  targetWeight: number | null;
  currentArea: { id: string; name: string } | null;
  areaHistory: {
    id: number;
    area: { id: string; name: string };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  closedAt: string | null;
  updatedAt: string;
};

export type BatchDetailAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  neutered: boolean;
  birthDate: string | null;
  breedName: string | null;
  currentWeightKg: number | null;
  lastWeighingDate: string | null;
  adgKgPerDay: number | null;
  enteredAt: string | null;
};

export type BatchFullDetails = {
  id: string;
  name: string;
  notes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  property: { id: string; name: string };
  saleGoal: { targetDate: string | null; targetWeightKg: number | null } | null;
  currentArea: {
    id: string;
    name: string;
    hectares: number;
    stockingRate: number;
    enteredAt: string;
  } | null;
  areaHistory: {
    id: number;
    area: { id: string; name: string };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  stocking: {
    capacityUa: number;
    currentUa: number;
    estimatedCount: number;
  } | null;
  animals: BatchDetailAnimal[];
  weightSeries: { date: string; avgWeightKg: number; animalCount: number }[];
  movements: {
    id: number;
    animal: {
      id: string;
      code: number;
      earTag: string | null;
      rfid: string | null;
    };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  pendingTransfers: {
    incoming: {
      id: string;
      transferredAt: string;
      animalCount: number;
      notes: string | null;
    }[];
    outgoing: {
      id: string;
      transferredAt: string;
      destinationBatch: { id: string; name: string };
      animalCount: number;
      notes: string | null;
    }[];
  };
  confirmedTransfers: {
    id: string;
    direction: "in" | "out";
    date: string;
    animalCount: number;
    otherBatchName: string | null;
  }[];
  purchases: {
    id: string;
    date: string;
    seller: { id: string; name: string };
    animalCount: number;
    confirmed: boolean;
  }[];
};

export type BatchListResult = {
  data: BatchRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
