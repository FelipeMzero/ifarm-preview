import type { PropertyZoneRef } from "../property/time-zones";
import type {
  ManagementSessionStatus,
  ParticipantStatus,
  StepType,
} from "./steps";

// Tipos das respostas da API (o contrato do que ela devolve): a API tipa o retorno com eles, e o
// web e o mobile, as telas. O que o cliente envia fica em schema.ts; as funções que chamam a
// API, em client.ts.

type Ref = { id: string; name: string };

export type ManagementSessionRow = {
  id: string;
  scheduledAt: string;
  performedAt: string | null;
  title: string;
  notes: string | null;
  steps: string[];
  animalCount: number;
  handledCount: number;
  status: ManagementSessionStatus;
  updatedAt: string;
};

// Etapa como a API a descreve: chave estável, rótulo e configuração do planejamento.
export type SessionStepView = {
  key: string;
  type: StepType;
  label: string;
  config?: Record<string, unknown>;
};

export type SessionAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  status: string;
  neutered: boolean;
  currentWeightKg: number | null;
  currentBatch: Ref | null;
  /** Situação que impede o animal de continuar na sessão aberta (ex.: "Morto"). */
  unavailableReason?: string | null;
};

// Brinco, RFID e peso registrados no animal nesta sessão (ainda não consolidados).
// Vazios fora de uma sessão aberta.
export type SessionValues = {
  earTag: string | null;
  rfid: string | null;
  weightKg: number | null;
};

export type SessionParticipant = {
  animal: SessionAnimal;
  sessionValues: SessionValues;
  status: ParticipantStatus;
  doneKeys: string[];
  lastHandledAt: string | null;
  /** Recepção de compra: categoria da compra em que o animal foi recebido. */
  categoryId: number | null;
};

export type ReceptionCategory = {
  id: number;
  label: string;
  sex: "MALE" | "FEMALE";
  breed: Ref | null;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  expectedQuantity: number;
  /** Recebidos na compra toda (todas as recepções). */
  receivedTotal: number;
  /** Recebidos nesta recepção. */
  receivedHere: number;
};

// Sessão usada como recepção de uma compra (sem valores da negociação).
export type ReceptionInfo = {
  id: string;
  purchaseEventId: string;
  purchaseTitle: string;
  sellerName: string;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  entryBatch: Ref;
  categories: ReceptionCategory[];
};

export type ManagementSessionDetail = {
  id: string;
  status: ManagementSessionStatus;
  scheduledAt: string;
  performedAt: string | null;
  title: string;
  notes: string;
  property: PropertyZoneRef;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  steps: SessionStepView[];
  participants: SessionParticipant[];
  reception: ReceptionInfo | null;
};

export type StepAnimalDetail = SessionAnimal & {
  birthDate: string | null;
  lastNeuteredAt: string | null;
  lastWeighedAt: string | null;
};

export type SessionAnimalContext = {
  session: {
    id: string;
    /** Propriedade da sessão: as opções da tela (lotes da apartação) são as dela. */
    propertyId: string;
    status: ManagementSessionStatus;
    performedAt: string | null;
  };
  steps: SessionStepView[];
  animal: StepAnimalDetail;
  records: Record<string, unknown>;
  sessionValues: SessionValues;
  status: ParticipantStatus;
};

export type ManagementOptions = {
  healthTypes: Ref[];
  neuteringTechniques: Ref[];
  people: Ref[];
  batches: Ref[];
};

export type ManagementSessionListResult = {
  data: ManagementSessionRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};
