import type { ComponentType } from "react";
import type { StepType } from "@/lib/management-steps";
import { STEP_ICONS } from "../display";
import BatchPlanFields from "./batch/BatchPlanFields";
import BatchStep from "./batch/BatchStep";
import { healthToPlanForm } from "./health/config";
import HealthPlanFields from "./health/HealthPlanFields";
import HealthStep from "./health/HealthStep";
import { RfidStep, TagStep } from "./identifier/IdentifierStep";
import NeuteringPlanFields from "./neutering/NeuteringPlanFields";
import NeuteringStep, { type NeuteringConfig } from "./neutering/NeuteringStep";
import type { ClientStepModule, StepScreenProps } from "./types";
import WeighingStep from "./weighing/WeighingStep";

// Telas de cada tipo de etapa. Um tipo novo entra aqui (e no registro da API).
const CLIENT_STEP_MODULES: Record<StepType, ClientStepModule> = {
  weighing: {
    type: "weighing",
    icon: STEP_ICONS.weighing,
    description: "Peso individual; atualiza o peso atual.",
    Screen: WeighingStep as ComponentType<StepScreenProps>,
  },
  neutering: {
    type: "neutering",
    icon: STEP_ICONS.neutering,
    description: "Registra a castração e o método.",
    Screen: NeuteringStep as ComponentType<StepScreenProps>,
    PlanFields: NeuteringPlanFields,
    planDefaults: () => ({ suggestedTechniqueId: "" }),
    toPlanForm: (step) => {
      const technique = (step.config as NeuteringConfig | undefined)
        ?.suggestedTechnique;
      return {
        suggestedTechniqueId: technique?.id ?? "",
        suggestedTechniqueName: technique?.name ?? "",
      };
    },
  },
  tag: {
    type: "tag",
    icon: STEP_ICONS.tag,
    description: "Coloca ou troca o brinco.",
    Screen: TagStep as ComponentType<StepScreenProps>,
  },
  rfid: {
    type: "rfid",
    icon: STEP_ICONS.rfid,
    description: "Coloca ou troca o RFID.",
    Screen: RfidStep as ComponentType<StepScreenProps>,
  },
  health: {
    type: "health",
    icon: STEP_ICONS.health,
    description: "Vacina, vermífugo, tratamento... (pode haver vários).",
    Screen: HealthStep as ComponentType<StepScreenProps>,
    PlanFields: HealthPlanFields,
    planDefaults: () => ({
      typeId: "",
      title: "",
      veterinarianId: "",
      doseType: "NONE",
      doseMl: "",
      doseWeightKg: "",
      withdrawalUntil: "",
      nextDueDate: "",
    }),
    toPlanForm: healthToPlanForm,
  },
  batch: {
    type: "batch",
    icon: STEP_ICONS.batch,
    description: "Destino do animal ao sair do manejo; sempre a última etapa.",
    Screen: BatchStep as ComponentType<StepScreenProps>,
    PlanFields: BatchPlanFields,
    planDefaults: () => ({ suggestedBatchIds: [] }),
    toPlanForm: (step) => ({
      suggestedBatchIds: (
        (step.config?.suggestedBatches ?? []) as { id: string }[]
      ).map((b) => b.id),
    }),
  },
};

export function clientStepModule(type: StepType) {
  return CLIENT_STEP_MODULES[type];
}
