import { readJson, type ApiRequest } from "../client";
import type { GeocodeParams } from "./schema";

/** Endereço encontrado pelo CEP. */
export type ZipCodeAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type Coordinates = { latitude: number; longitude: number };

const ADDRESS = "/api/address";

// Consultas de endereço. A API é quem fala com os serviços externos (ViaCEP e Nominatim).
export function createAddressClient(request: ApiRequest) {
  return {
    /** Endereço do CEP (com ou sem máscara); null se o CEP não existe. */
    async lookupZipCode(zipCode: string) {
      const digits = zipCode.replace(/\D/g, "");
      const response = await request(`${ADDRESS}/zip/${digits}`);
      const result = await readJson<{ data: ZipCodeAddress | null }>(
        response,
        "Não foi possível buscar o endereço pelo CEP.",
      );
      return result.data;
    },

    /** Coordenadas aproximadas do endereço; null se nada foi encontrado. */
    async geocode(params: GeocodeParams) {
      const query = new URLSearchParams(
        Object.entries(params).filter((e): e is [string, string] => !!e[1]),
      );
      const response = await request(`${ADDRESS}/geocode?${query}`);
      const result = await readJson<{ data: Coordinates | null }>(
        response,
        "Não foi possível localizar o endereço.",
      );
      return result.data;
    },
  };
}
