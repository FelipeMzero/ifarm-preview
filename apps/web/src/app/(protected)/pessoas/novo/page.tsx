"use client";

import { useRouter } from "next/navigation";
import PersonForm from "@/features/person/PersonForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <PersonForm
        title="Nova Pessoa"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/pessoas/${newId}`)}
      />
    </div>
  );
}
