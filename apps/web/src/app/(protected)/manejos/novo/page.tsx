"use client";

import { useRouter } from "next/navigation";
import { ManagementSessionForm } from "@/features/management-session/ManagementSessionForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <ManagementSessionForm
        title="Nova Sessão de Manejo"
        onCancel={() => router.back()}
        onSuccess={() => router.replace("/manejos")}
      />
    </div>
  );
}
