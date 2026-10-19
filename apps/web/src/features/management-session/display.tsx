import { formatDate } from "@ifarm/shared";
import {
  Boxes,
  Nfc,
  Scale,
  Scissors,
  Syringe,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ManagementSessionStatus,
  ParticipantStatus,
  StepType,
} from "@ifarm/shared";

export const SESSION_STATUS_LABELS: Record<ManagementSessionStatus, string> = {
  planned: "Planejada",
  in_progress: "Em andamento",
  confirmed: "Consolidada",
  cancelled: "Cancelada",
};

const SESSION_STATUS_VARIANT = {
  planned: "outline",
  in_progress: "secondary",
  confirmed: "default",
  cancelled: "secondary",
} as const;

export function SessionStatusBadge({
  status,
}: {
  status: ManagementSessionStatus;
}) {
  return (
    <Badge variant={SESSION_STATUS_VARIANT[status]}>
      {SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  pending: "A manejar",
  partial: "Parcial",
  done: "Completo",
};

export function ParticipantStatusBadge({
  status,
}: {
  status: ParticipantStatus;
}) {
  return (
    <Badge
      variant={status === "done" ? "default" : "outline"}
      className={
        status === "partial"
          ? "border-warning/40 bg-warning/10 text-warning"
          : undefined
      }
    >
      {PARTICIPANT_STATUS_LABELS[status]}
    </Badge>
  );
}

export const STEP_ICONS: Record<StepType, LucideIcon> = {
  weighing: Scale,
  neutering: Scissors,
  tag: Tag,
  rfid: Nfc,
  health: Syringe,
  batch: Boxes,
};

// Datas da sessão são dias (sem horário).
export function formatSessionDate(value: string) {
  return formatDate(value.slice(0, 10));
}

export function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}
