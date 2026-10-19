import type { ReceptionPurchase } from "@ifarm/shared";

// "A receber": compra em andamento que ainda não recebeu tudo o que foi negociado ou
// que tem uma recepção em aberto.
export function isPending(p: ReceptionPurchase) {
  return (
    p.status === "open" &&
    (p.receivedQuantity < p.expectedQuantity || p.hasOpenReception)
  );
}
