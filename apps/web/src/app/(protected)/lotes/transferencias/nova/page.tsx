"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { BatchTransferForm } from "@/features/batch-transfer/BatchTransferForm";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; origem?: string }>;
}) {
  const { destino, origem } = use(searchParams);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <BatchTransferForm
        title="Nova Transferência"
        initialDestinationBatchId={destino}
        initialOriginBatchId={origem}
        onCancel={() => router.back()}
        onSuccess={() => router.replace("/lotes/transferencias")}
      />
    </div>
  );
}
