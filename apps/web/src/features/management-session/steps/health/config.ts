import type { SessionStepView } from "../../services";
import type { PlanStepForm } from "../../schema";

export type HealthPricingType = "FREE" | "FIXED" | "PER_WEIGHT";

// Configuração do procedimento definida no planejamento (StepView.config).
export type HealthConfig = {
  healthManagementId: string;
  typeId: string;
  typeName: string;
  title: string | null;
  veterinarianId: string | null;
  veterinarianName: string | null;
  pricingType: HealthPricingType | null;
  unitPrice: number | null;
  withdrawalUntil: string | null;
  nextDueDate: string | null;
};

export const PRICING_LABELS: Record<HealthPricingType, string> = {
  FREE: "Gratuito",
  FIXED: "Valor fixo por animal",
  PER_WEIGHT: "Valor por kg",
};

export function healthToPlanForm(step: SessionStepView): Partial<PlanStepForm> {
  const c = (step.config ?? {}) as Partial<HealthConfig>;
  return {
    healthManagementId: c.healthManagementId,
    typeId: c.typeId ?? "",
    title: c.title ?? "",
    veterinarianId: c.veterinarianId ?? "",
    pricingType: c.pricingType ?? "",
    unitPrice: c.unitPrice != null ? String(c.unitPrice) : "",
    withdrawalUntil: c.withdrawalUntil ?? "",
    nextDueDate: c.nextDueDate ?? "",
  };
}
