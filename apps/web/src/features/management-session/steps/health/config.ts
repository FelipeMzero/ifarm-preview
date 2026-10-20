import type { SessionStepView } from "@ifarm/shared";
import type { PlanStepForm } from "../../schema";

export type HealthDoseType = "NONE" | "FIXED" | "PER_WEIGHT";

// Configuração do procedimento definida no planejamento (StepView.config).
export type HealthConfig = {
  healthManagementId: string;
  typeId: string;
  typeName: string;
  title: string | null;
  veterinarianId: string | null;
  veterinarianName: string | null;
  doseType: HealthDoseType;
  doseMl: number | null;
  doseWeightKg: number | null;
  withdrawalEndDate: string | null;
  nextDueDate: string | null;
};

export const DOSE_LABELS: Record<HealthDoseType, string> = {
  NONE: "Sem dose",
  FIXED: "Fixa por animal",
  PER_WEIGHT: "Por peso",
};

const formatMl = (value: number) =>
  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ml`;

// Regra de dose por extenso (ex.: "5 ml por animal", "1 ml a cada 50 kg").
export function describeDose(config: HealthConfig) {
  if (config.doseType === "NONE" || config.doseMl == null) return null;
  if (config.doseType === "FIXED")
    return `${formatMl(config.doseMl)} por animal`;
  return `${formatMl(config.doseMl)} a cada ${config.doseWeightKg ?? "?"} kg`;
}

// Dose sugerida para o animal pela regra do procedimento (arredondada a 0,1 ml);
// null quando o procedimento não tem dose ou falta o peso.
export function doseFor(config: HealthConfig, weightKg: number | null) {
  if (config.doseMl == null) return null;
  if (config.doseType === "FIXED") return config.doseMl;
  if (
    config.doseType === "PER_WEIGHT" &&
    config.doseWeightKg != null &&
    weightKg != null
  ) {
    return (
      Math.round((config.doseMl * weightKg * 10) / config.doseWeightKg) / 10
    );
  }
  return null;
}

export function healthToPlanForm(step: SessionStepView): Partial<PlanStepForm> {
  const c = (step.config ?? {}) as Partial<HealthConfig>;
  return {
    healthManagementId: c.healthManagementId,
    typeId: c.typeId ?? "",
    title: c.title ?? "",
    veterinarianId: c.veterinarianId ?? "",
    doseType: c.doseType ?? "NONE",
    doseMl: c.doseMl != null ? String(c.doseMl) : "",
    doseWeightKg: c.doseWeightKg != null ? String(c.doseWeightKg) : "",
    withdrawalEndDate: c.withdrawalEndDate ?? "",
    nextDueDate: c.nextDueDate ?? "",
  };
}
