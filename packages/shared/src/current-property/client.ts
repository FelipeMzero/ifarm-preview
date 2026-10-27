import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { BrTimeZone } from "../property/time-zones";
import type { CurrentPropertyPayload } from "./schema";

/** A propriedade em que o usuário está trabalhando, com o fuso dela (RN-PROPRIEDADE-05). */
export type CurrentProperty = {
  id: string;
  name: string;
  timeZone: BrTimeZone;
};

export type CurrentPropertyDetails = {
  id: string;
  name: string;
  ownerName: string;
  totalArea: number | null;
  productiveArea: number | null;
  city: string | null;
  state: string | null;
};

const CURRENT_PROPERTY = "/api/user/current-property";

export function createCurrentPropertyClient(request: ApiRequest) {
  return {
    async getCurrentProperty() {
      const response = await request(CURRENT_PROPERTY);
      const result = await readJson<{ data: CurrentProperty | null }>(
        response,
        "Não foi possível carregar a propriedade atual.",
      );
      return result.data;
    },

    async setCurrentProperty(propertyId: string) {
      const response = await request(
        CURRENT_PROPERTY,
        jsonRequest("PUT", { propertyId } satisfies CurrentPropertyPayload),
      );
      const result = await readJson<{ data: CurrentProperty }>(
        response,
        "Não foi possível trocar de propriedade.",
      );
      return result.data;
    },

    async getCurrentPropertyDetails() {
      const response = await request(`${CURRENT_PROPERTY}/details`);
      const result = await readJson<{ data: CurrentPropertyDetails | null }>(
        response,
        "Não foi possível carregar a propriedade atual.",
      );
      return result.data;
    },
  };
}
