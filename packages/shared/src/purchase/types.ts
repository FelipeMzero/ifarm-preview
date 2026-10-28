import type { PropertyZoneRef } from "../property/time-zones";
import type { PurchaseCostSplit, PurchasePricingType, Sex } from "../enums";
import type { ManagementSessionStatus } from "../management-session/steps";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

export type PurchaseStatus = "open" | "confirmed" | "cancelled";

type Ref = { id: string; name: string };

export type PurchaseRow = {
  id: string;
  title: string;
  purchaseDate: string;
  seller: Ref;
  categories: string[];
  expectedQuantity: number;
  receivedQuantity: number;
  receptionCount: number;
  /** Estimado em andamento; sobre os recebidos depois de consolidada. */
  value: number | null;
  status: PurchaseStatus;
  paid: boolean;
};

export type PurchaseListResult = {
  data: PurchaseRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type PurchaseCategory = {
  id: number;
  label: string;
  sex: Sex;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  breed: Ref | null;
  expectedQuantity: number;
  pricingType: PurchasePricingType;
  unitPrice: number | null;
  totalPrice: number | null;
  invoicedWeight: number | null;
  shrinkPercent: number | null;
  costSplit: PurchaseCostSplit;
  notes: string | null;
  receivedQuantity: number;
  estimatedValue: number | null;
  /** Soma do peso de chegada dos recebidos (sugestão do peso por arroba). */
  arrivalWeight: { totalKg: number; weighed: number; received: number };
  costTotal: number | null;
};

export type PurchaseReception = {
  id: string;
  sessionId: string;
  title: string;
  status: ManagementSessionStatus;
  scheduledAt: string;
  performedAt: string | null;
  entryBatch: Ref;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  animalCount: number;
};

export type PurchaseDetail = {
  id: string;
  title: string;
  status: PurchaseStatus;
  purchaseDate: string;
  notes: string;
  seller: Ref;
  destinationProperty: PropertyZoneRef;
  paymentDate: string | null;
  paymentReference: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  categories: PurchaseCategory[];
  receptions: PurchaseReception[];
};
