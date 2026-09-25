"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { BatchTransferForm } from "@/features/batch-transfer/BatchTransferForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <BatchTransferForm
        id={id}
        title="Transferência entre Lotes"
        onCancel={() => router.back()}
        onSuccess={() => router.replace("/lotes/transferencias")}
      />
    </div>
  );
}
