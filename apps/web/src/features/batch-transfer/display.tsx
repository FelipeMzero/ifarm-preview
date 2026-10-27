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
