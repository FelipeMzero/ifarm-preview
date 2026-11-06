import { queryOptions } from "@tanstack/react-query";
import { dashboardClient } from "@/lib/clients";

// Chaves das consultas do painel/dashboard no cache do TanStack Query.
export const dashboardKeys = {
  all: ["dashboard"] as const,
  property: (propertyId?: string) => ["dashboard", propertyId] as const,
};

export const dashboardQuery = (propertyId?: string) =>
  queryOptions({
    queryKey: dashboardKeys.property(propertyId),
    queryFn: () => dashboardClient.getDashboard({ propertyId: propertyId! }),
    enabled: !!propertyId,
  });
