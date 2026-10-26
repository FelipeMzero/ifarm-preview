import tzLookup from "@photostructure/tz-lookup";
import { isBrTimeZone, type BrTimeZone } from "@ifarm/shared";

// Fuso horário de um ponto, para sugerir o fuso da propriedade. Calculado aqui, sem serviço
// externo; perto das divisas o resultado é aproximado (o usuário confirma ou troca na tela).
// Fora do Brasil (ou num fuso fora da lista): null.
export function lookupTimeZone(
  latitude: number,
  longitude: number,
): BrTimeZone | null {
  const timeZone = tzLookup(latitude, longitude);
  return isBrTimeZone(timeZone) ? timeZone : null;
}
