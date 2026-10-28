import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { CurrentPropertyPayload } from "./schema";
import type { CurrentProperty, CurrentPropertyDetails } from "./types";

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
