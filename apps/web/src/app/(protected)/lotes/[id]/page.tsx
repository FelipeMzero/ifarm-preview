"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { BatchForm } from "@/features/batch/BatchForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <BatchForm
        id={id}
        title="Editar Lote"
        onCancel={() => router.back()}
        onSuccess={() => {}}
      />
    </div>
  );
}
