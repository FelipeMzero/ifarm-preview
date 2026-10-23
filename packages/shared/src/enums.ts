// Espelho dos enums do schema.prisma, para uso fora do apps/web (o Prisma os gera dentro dele, onde
// o mobile não alcança). O teste packages/domain/src/enums.test.ts falha se as duas definições
// divergirem: ao mudar um enum no schema.prisma, atualize este arquivo.

export const HealthManagementDoseType = {
  NONE: "NONE",
  FIXED: "FIXED",
  PER_WEIGHT: "PER_WEIGHT",
} as const;

export type HealthManagementDoseType =
  (typeof HealthManagementDoseType)[keyof typeof HealthManagementDoseType];

export const ManagementStepType = {
  WEIGHING: "WEIGHING",
  NEUTERING: "NEUTERING",
  TAG: "TAG",
  RFID: "RFID",
  BRAND: "BRAND",
  HEALTH: "HEALTH",
  BATCH: "BATCH",
} as const;

export type ManagementStepType =
  (typeof ManagementStepType)[keyof typeof ManagementStepType];

export const PurchasePricingType = {
  PER_HEAD: "PER_HEAD",
  PER_ARROBA: "PER_ARROBA",
  LUMP_SUM: "LUMP_SUM",
} as const;

export type PurchasePricingType =
  (typeof PurchasePricingType)[keyof typeof PurchasePricingType];

export const PurchaseCostSplit = {
  EQUAL: "EQUAL",
  BY_WEIGHT: "BY_WEIGHT",
} as const;

export type PurchaseCostSplit =
  (typeof PurchaseCostSplit)[keyof typeof PurchaseCostSplit];

export const Sex = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export type Sex = (typeof Sex)[keyof typeof Sex];

export const AnimalOrigin = {
  UNDEFINED: "UNDEFINED",
  BIRTH: "BIRTH",
  PURCHASE: "PURCHASE",
  DONATION: "DONATION",
  REFERENCE: "REFERENCE",
} as const;

export type AnimalOrigin = (typeof AnimalOrigin)[keyof typeof AnimalOrigin];

export const AnimalLossType = {
  DEAD: "DEAD",
  MISSING: "MISSING",
} as const;

export type AnimalLossType =
  (typeof AnimalLossType)[keyof typeof AnimalLossType];

export const AnimalStatus = {
  ACTIVE: "ACTIVE",
  SOLD: "SOLD",
  DONATED: "DONATED",
  DEAD: "DEAD",
  MISSING: "MISSING",
  SLAUGHTERED: "SLAUGHTERED",
  REFERENCE: "REFERENCE",
} as const;

export type AnimalStatus = (typeof AnimalStatus)[keyof typeof AnimalStatus];

export const PersonType = {
  INDIVIDUAL: "INDIVIDUAL",
  COMPANY: "COMPANY",
} as const;

export type PersonType = (typeof PersonType)[keyof typeof PersonType];

export const MaritalStatus = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  STABLE_UNION: "STABLE_UNION",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
} as const;

export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus];
