import type { Sex, UaTotal } from "@ifarm/shared";

// Lotação em Unidade Animal (UA). Só informa: nenhuma operação é bloqueada por excesso.

// Unidade Animal: 450 kg de peso vivo.
export const UA_KG = 450;

// Equivalência usada quando o animal não tem peso, mas tem data de nascimento.
const UA_BY_AGE = {
  upTo12Months: 0.4,
  upTo24Months: 0.75,
  adult: 1,
  adultBull: 1.25,
} as const;

// Capacidade da área em UA (hectares × taxa de lotação, em UA/ha) e se a ocupação a
// ultrapassa.
export function capacityCheck(
  area: { hectares: number; stockingRate: number },
  ua: number,
) {
  const capacityUa = area.hectares * area.stockingRate;
  return { capacityUa, exceeds: ua > capacityUa };
}

// Sem peso e sem idade: conta como 1 UA para não subestimar a ocupação.
const UA_FALLBACK = 1;

export type UaAnimal = {
  currentWeight: number | null;
  /** Data de nascimento como gravada no banco (meia-noite UTC do dia). */
  birthDate: Date | null;
  sex: Sex;
  neutered: boolean;
};

// Em UTC, como as datas de nascimento são gravadas (ver toDbDate).
function ageInMonths(birthDate: Date, now: Date) {
  return (
    (now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birthDate.getUTCMonth())
  );
}

// UA de um animal: pelo peso quando houver; senão estimada pela idade; senão 1 UA.
export function animalUnits(
  animal: UaAnimal,
  now = new Date(),
): { ua: number; estimated: boolean } {
  if (animal.currentWeight != null && animal.currentWeight > 0) {
    return { ua: animal.currentWeight / UA_KG, estimated: false };
  }

  if (animal.birthDate) {
    const months = ageInMonths(animal.birthDate, now);
    if (months <= 12) return { ua: UA_BY_AGE.upTo12Months, estimated: true };
    if (months <= 24) return { ua: UA_BY_AGE.upTo24Months, estimated: true };
    const isBull = animal.sex === "MALE" && !animal.neutered;
    return {
      ua: isBull ? UA_BY_AGE.adultBull : UA_BY_AGE.adult,
      estimated: true,
    };
  }

  return { ua: UA_FALLBACK, estimated: true };
}

export function sumUnits(animals: UaAnimal[], now: Date): UaTotal {
  return animals.reduce<UaTotal>(
    (acc, a) => {
      const { ua, estimated } = animalUnits(a, now);
      return {
        ua: acc.ua + ua,
        count: acc.count + 1,
        estimatedCount: acc.estimatedCount + (estimated ? 1 : 0),
      };
    },
    { ua: 0, count: 0, estimatedCount: 0 },
  );
}
