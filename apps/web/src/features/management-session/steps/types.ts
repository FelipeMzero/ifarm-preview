import type { ComponentType } from "react";
import type { Control } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import type { StepType } from "@ifarm/shared";
import type {
  ManagementOptions,
  SessionStepView,
  StepAnimalDetail,
} from "@ifarm/shared";
import type { PlanFormData, PlanStepForm } from "../schema";

/**
 * Props da tela de registro de uma etapa. A tela renderiza o próprio <form id={formId}>;
 * os botões de navegação (Anterior / Pular / Avançar) ficam no contêiner e
 * submetem esse form. `onSubmit` grava na API e lança ApiError em caso de erro.
 */
export type StepScreenProps<TRecord = unknown> = {
  formId: string;
  step: SessionStepView;
  animal: StepAnimalDetail;
  /** Registro desta etapa no animal, se já feito. */
  record: TRecord | null;
  /** Registros das demais etapas no animal (ex.: o sanitário usa o peso da sessão). */
  records: Record<string, unknown>;
  options: ManagementOptions;
  readOnly: boolean;
  onSubmit: (payload: unknown) => Promise<void>;
};

/** Campos extras da etapa no planejamento (ex.: produto do sanitário). */
export type PlanFieldsProps = {
  index: number;
  control: Control<PlanFormData>;
  options: ManagementOptions;
  disabled?: boolean;
};

export type ClientStepModule = {
  type: StepType;
  icon: LucideIcon;
  /** Descrição curta exibida ao adicionar o manejo no planejamento. */
  description: string;
  Screen: ComponentType<StepScreenProps>;
  PlanFields?: ComponentType<PlanFieldsProps>;
  /** Valores iniciais da etapa ao ser adicionada no planejamento. */
  planDefaults?: () => Partial<PlanStepForm>;
  /** Converte a etapa gravada de volta para o formulário de planejamento. */
  toPlanForm?: (step: SessionStepView) => Partial<PlanStepForm>;
};
