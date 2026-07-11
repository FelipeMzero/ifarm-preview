"use client";

import { useRouter } from "next/navigation";
import PersonForm from "../PersonForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="w-full justify-center p-8">
      <PersonForm
        title="Nova Pessoa"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/pessoas/${newId}`)}
      />
    </div>
  );
}
