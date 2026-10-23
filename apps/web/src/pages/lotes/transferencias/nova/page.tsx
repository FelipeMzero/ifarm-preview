import { useNavigate, useSearchParams } from "react-router";
import { BatchTransferForm } from "@/features/batch-transfer/BatchTransferForm";

export default function Page() {
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
