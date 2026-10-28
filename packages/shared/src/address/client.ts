import { readJson, toQueryString, type ApiRequest } from "../client";
import type { BrTimeZone } from "../property/time-zones";
import type { GeocodeParams } from "./schema";
import type { ZipCodeAddress, Coordinates } from "./types";

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
      const response = await request(
        `${ADDRESS}/geocode?${toQueryString(params)}`,
      );
      const result = await readJson<{ data: Coordinates | null }>(
        response,
        "Não foi possível localizar o endereço.",
      );
      return result.data;
    },

    /** Fuso horário do Brasil em que fica o ponto; null se o ponto fica fora do Brasil. */
    async lookupTimeZone({ latitude, longitude }: Coordinates) {
      const response = await request(
        `${ADDRESS}/time-zone?${toQueryString({ latitude, longitude })}`,
      );
      const result = await readJson<{ data: BrTimeZone | null }>(
        response,
        "Não foi possível obter o fuso horário da localização.",
      );
      return result.data;
    },
  };
}
