import { useNavigate, useSearchParams } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { BatchTransferList } from "@/features/batch-transfer/BatchTransferList";
import { BatchTransferForm } from "@/features/batch-transfer/BatchTransferForm";

export function BatchTransferListPage() {
  return (
    <div className="flex justify-center p-8">
      <BatchTransferList />
    </div>
  );
}

// Atalhos dos lotes: ?destino= (transferir animais para o lote) e ?origem= (esvaziar o lote).
export function BatchTransferNewPage() {
  const [searchParams] = useSearchParams();
  const destino = searchParams.get("destino") ?? undefined;
  const origem = searchParams.get("origem") ?? undefined;
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <BatchTransferForm
        title="Nova Transferência"
        initialDestinationBatchId={destino}
        initialOriginBatchId={origem}
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate("/lotes/transferencias", { replace: true })}
      />
    </div>
  );
}

export function BatchTransferEditPage() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <BatchTransferForm
        id={id}
        title="Transferência entre Lotes"
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate("/lotes/transferencias", { replace: true })}
      />
    </div>
  );
}
