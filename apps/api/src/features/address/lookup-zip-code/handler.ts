import type { ZipCodeAddress } from "@ifarm/shared";
import { cached, getJson } from "../external";

const zipCache = cached<ZipCodeAddress | null>();

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/** Endereço do CEP (8 dígitos); null se o CEP não existe. */
export async function lookupZipCode(digits: string) {
  if (zipCache.has(digits)) return zipCache.get(digits)!;
  const data = (await getJson(
    `https://viacep.com.br/ws/${digits}/json/`,
  )) as ViaCepResponse;
  const address: ZipCodeAddress | null = data.erro
    ? null
    : {
        zipCode: digits,
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
  zipCache.set(digits, address);
  return address;
}
