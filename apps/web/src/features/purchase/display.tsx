import { Badge } from "@/components/ui/badge";
import {
  type PurchaseCostSplit,
  type PurchasePricingType,
  type PurchaseStatus,
  formatDate,
} from "@ifarm/shared";

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  open: "Em andamento",
  confirmed: "Consolidada",
  cancelled: "Cancelada",
};

const PURCHASE_STATUS_VARIANT = {
  open: "outline",
  confirmed: "default",
  cancelled: "secondary",
} as const;

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <Badge variant={PURCHASE_STATUS_VARIANT[status]}>
      {PURCHASE_STATUS_LABELS[status]}
    </Badge>
  );
}

export const PRICING_LABELS: Record<PurchasePricingType, string> = {
  PER_HEAD: "Por cabeça",
  PER_ARROBA: "Por arroba",
  LUMP_SUM: "Valor fechado",
};

export const COST_SPLIT_LABELS: Record<PurchaseCostSplit, string> = {
  EQUAL: "Igual entre os animais",
  BY_WEIGHT: "Proporcional ao peso de entrada",
};

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Datas da compra são dias (sem horário).
export const formatDay = (value: string) => formatDate(value.slice(0, 10));

// Recebidos x esperados, com destaque quando passa do negociado.
export function ReceivedCount({
  received,
  expected,
}: {
  received: number;
  expected: number;
}) {
  const over = received > expected;
  return (
    <span
      className={
        over
          ? "tabular-nums font-medium text-warning"
          : received === expected && expected > 0
            ? "tabular-nums font-medium text-primary"
            : "tabular-nums"
      }
      title={
        over ? `${received - expected} animal(is) além do negociado` : undefined
      }
    >
      {received}/{expected}
    </span>
  );
}
