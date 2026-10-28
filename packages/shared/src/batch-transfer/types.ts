// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type BatchTransferStatus = "pending" | "confirmed" | "cancelled";

type BatchRef = { id: string; name: string };

export type BatchTransferRow = {
  id: string;
  transferredAt: string;
  notes: string | null;
  originBatches: string[];
  destinationBatch: BatchRef;
  animalCount: number;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
};

export type BatchTransferListResult = {
  data: BatchTransferRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type TransferAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  status: string;
  currentWeightKg: number | null;
  currentBatch: BatchRef | null;
  // Lote de onde o animal saiu; só é preenchido quando a transferência é confirmada.
  originBatch?: BatchRef | null;
  // Situação que impede o animal de continuar na transferência pendente (ex.: "Morto").
  unavailableReason?: string | null;
};

export type BatchTransferDetail = {
  id: string;
  transferredAt: string;
  notes: string;
  destinationBatch: BatchRef;
  propertyId: string;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  animals: TransferAnimal[];
};
