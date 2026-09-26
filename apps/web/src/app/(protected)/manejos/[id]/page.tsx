"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ManagementSessionForm } from "@/features/management-session/ManagementSessionForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <ManagementSessionForm
        id={id}
        title="Planejamento do Manejo"
        onCancel={() => router.back()}
        onSuccess={() => router.back()}
      />
    </div>
  );
}
