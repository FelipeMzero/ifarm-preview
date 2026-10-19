// Espelho dos enums do schema.prisma usados fora do apps/web. O Prisma gera os enums dentro do
// apps/web, onde o mobile não alcança; o teste apps/web/src/server/enums.test.ts falha se as duas
// definições divergirem.

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
