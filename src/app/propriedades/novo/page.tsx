"use client";

import { useRouter } from "next/navigation";
import PropertyForm from "../PropertyForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="w-full justify-center p-8">
      <PropertyForm
        title="Nova Propriedade"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/propriedades/${newId}`)}
      />
    </div>
  );
}
