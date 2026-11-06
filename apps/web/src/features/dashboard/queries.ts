import { queryOptions } from "@tanstack/react-query";
import { dashboardClient } from "@/lib/clients";

// Chaves das consultas do painel/dashboard no cache do TanStack Query.
export const dashboardKeys = {
  all: ["dashboard"] as const,
  property: (propertyId?: string, batchId?: string) =>
    ["dashboard", propertyId, batchId] as const,
};

export const dashboardQuery = (propertyId?: string, batchId?: string) =>
  queryOptions({
    queryKey: dashboardKeys.property(propertyId, batchId),
    queryFn: () =>
      dashboardClient.getDashboard({
        propertyId: propertyId!,
        batchId: batchId || undefined,
      }),
    enabled: !!propertyId,
  });
