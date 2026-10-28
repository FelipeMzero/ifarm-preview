import type { ManagementSessionStatus } from "../management-session/steps";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

type Ref = { id: string; name: string };

export type ReceptionPurchaseCategory = {
  id: number;
  label: string;
  expectedQuantity: number;
  receivedQuantity: number;
};

export type ReceptionSummary = {
  id: string;
  sessionId: string;
  title: string;
  status: ManagementSessionStatus;
  performedAt: string | null;
  scheduledAt: string;
  entryBatch: Ref;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  animalCount: number;
};

export type ReceptionPurchase = {
  id: string;
  title: string;
  purchaseDate: string;
  notes: string | null;
  seller: Ref;
  /** Recepções só em compras em andamento. */
  status: "open" | "confirmed" | "cancelled";
  categories: ReceptionPurchaseCategory[];
  receptions: ReceptionSummary[];
  expectedQuantity: number;
  receivedQuantity: number;
  hasOpenReception: boolean;
};

export type ReceptionPurchaseListResult = {
  data: ReceptionPurchase[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type ReceptionFilter = "pending" | "all";

export type ReceptionDocuments = {
  gtaNumber?: string | null;
  invoiceNumber?: string | null;
};
