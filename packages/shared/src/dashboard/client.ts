import { readJson, toQueryString, type ApiRequest } from "../client";
import type { DashboardQuery } from "./schema";
import type { DashboardData } from "./types";

const DASHBOARD = "/api/dashboard";

export function createDashboardClient(request: ApiRequest) {
  return {
    async getDashboard(params: DashboardQuery) {
      const response = await request(`${DASHBOARD}?${toQueryString(params)}`);
      const result = await readJson<{ data: DashboardData }>(
        response,
        "Não foi possível carregar as informações do painel.",
      );
      return result.data;
    },
  };
}
