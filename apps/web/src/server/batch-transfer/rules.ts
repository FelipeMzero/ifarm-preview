import type { BatchTransferStatus } from "@ifarm/shared";

export function transferStatus(t: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}): BatchTransferStatus {
  if (t.cancelledAt) return "cancelled";
  if (t.confirmedAt) return "confirmed";
  return "pending";
}
