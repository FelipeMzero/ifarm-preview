// Fusos horários do Brasil (identificadores IANA), para o fuso da propriedade
// (RN-PROPRIEDADE-05): do leste para o oeste, com a região e o deslocamento em relação ao UTC.
// Os do mesmo deslocamento são equivalentes hoje; ficam separados porque cada um segue as
// mudanças de horário da sua região (ex.: horário de verão).
export const BR_TIME_ZONE_ITEMS = [
  { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
  {
    value: "America/Sao_Paulo",
    label: "Brasília: DF, GO, Sul e Sudeste (UTC−3)",
  },
  { value: "America/Bahia", label: "Bahia (UTC−3)" },
  { value: "America/Maceio", label: "Alagoas e Sergipe (UTC−3)" },
  { value: "America/Recife", label: "Pernambuco (UTC−3)" },
  {
    value: "America/Fortaleza",
    label: "Ceará, Maranhão, Paraíba, Piauí e Rio Grande do Norte (UTC−3)",
  },
  { value: "America/Araguaina", label: "Tocantins (UTC−3)" },
  { value: "America/Belem", label: "Amapá e leste do Pará (UTC−3)" },
  { value: "America/Santarem", label: "Oeste do Pará (UTC−3)" },
  { value: "America/Cuiaba", label: "Mato Grosso (UTC−4)" },
  { value: "America/Campo_Grande", label: "Mato Grosso do Sul (UTC−4)" },
  { value: "America/Porto_Velho", label: "Rondônia (UTC−4)" },
  { value: "America/Boa_Vista", label: "Roraima (UTC−4)" },
  { value: "America/Manaus", label: "Amazonas (UTC−4)" },
  { value: "America/Eirunepe", label: "Oeste do Amazonas (UTC−5)" },
  { value: "America/Rio_Branco", label: "Acre (UTC−5)" },
] as const;

export type BrTimeZone = (typeof BR_TIME_ZONE_ITEMS)[number]["value"];

export const BR_TIME_ZONES = BR_TIME_ZONE_ITEMS.map((item) => item.value) as [
  BrTimeZone,
  ...BrTimeZone[],
];

/** Horário de Brasília: o fuso padrão das propriedades (o mesmo padrão do banco). */
export const DEFAULT_TIME_ZONE: BrTimeZone = "America/Sao_Paulo";

export function isBrTimeZone(value: string): value is BrTimeZone {
  return (BR_TIME_ZONES as string[]).includes(value);
}

/** Nome da região e deslocamento do fuso (ex.: "Mato Grosso (UTC−4)"). */
export function timeZoneLabel(value: string): string {
  return (
    BR_TIME_ZONE_ITEMS.find((item) => item.value === value)?.label ?? value
  );
}
