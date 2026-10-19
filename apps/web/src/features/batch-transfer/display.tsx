import { Badge } from "@/components/ui/badge";
import { type BatchTransferStatus } from "@ifarm/shared";

export const TRANSFER_STATUS_LABELS: Record<BatchTransferStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const TRANSFER_STATUS_VARIANT = {
  pending: "outline",
  confirmed: "default",
  cancelled: "secondary",
} as const;

export function TransferStatusBadge({
  status,
}: {
  status: BatchTransferStatus;
}) {
  return (
    <Badge variant={TRANSFER_STATUS_VARIANT[status]}>
      {TRANSFER_STATUS_LABELS[status]}
    </Badge>
  );
}

// Datas de transferência são dias (sem horário); o sufixo evita o deslocamento de fuso.
export function formatTransferDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR");
}
