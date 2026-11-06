import { z } from "zod";

// Parâmetros da consulta do painel.
export const dashboardQuerySchema = z.object({
  propertyId: z.string().uuid("Propriedade inválida."),
  batchId: z.string().uuid().optional(),
});

export type DashboardQuery = z.output<typeof dashboardQuerySchema>;
