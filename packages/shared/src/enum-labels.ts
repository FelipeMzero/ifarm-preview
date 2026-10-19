import type {
  Sex,
  AnimalOrigin,
  AnimalStatus,
  PersonType,
  MaritalStatus,
} from "./enums";

export const SEX_LABELS: Record<Sex, string> = {
  MALE: "Macho",
  FEMALE: "Fêmea",
};

export const ANIMAL_ORIGIN_LABELS: Record<AnimalOrigin, string> = {
  UNDEFINED: "Indefinida",
  BIRTH: "Nascimento",
  PURCHASE: "Compra",
  DONATION: "Doação",
  REFERENCE: "Referência",
};

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  ACTIVE: "Ativo",
  SOLD: "Vendido",
  DONATED: "Doado",
  DEAD: "Morto",
  MISSING: "Desaparecido",
  SLAUGHTERED: "Abatido",
  REFERENCE: "Referência",
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  INDIVIDUAL: "Física",
  COMPANY: "Jurídica",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  SINGLE: "Solteiro(a)",
  MARRIED: "Casado(a)",
  STABLE_UNION: "União Estável",
  DIVORCED: "Divorciado(a)",
  WIDOWED: "Viúvo(a)",
};

function toItems<T extends string>(
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({
    value: value as T,
    label: label as string,
  }));
}

export const SEX_ITEMS = toItems(SEX_LABELS);
export const ANIMAL_ORIGIN_ITEMS = toItems(ANIMAL_ORIGIN_LABELS);
export const ANIMAL_STATUS_ITEMS = toItems(ANIMAL_STATUS_LABELS);
export const PERSON_TYPE_ITEMS = toItems(PERSON_TYPE_LABELS);
export const MARITAL_STATUS_ITEMS = toItems(MARITAL_STATUS_LABELS);
