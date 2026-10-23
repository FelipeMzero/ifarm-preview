import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import { BatchTransferForm } from "@/features/batch-transfer/BatchTransferForm";

export default function Page() {
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
