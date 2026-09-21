"use client";

import { useRouter } from "next/navigation";
import { BatchForm } from "@/features/batch/BatchForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <BatchForm
        title="Novo Lote"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/lotes/${newId}`)}
      />
    </div>
  );
}
