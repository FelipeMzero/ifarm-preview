"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import PropertyForm from "../PropertyForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <PropertyForm
        id={id}
        title="Propriedade"
        onCancel={() => router.back()}
        onSuccess={() => {}}
      />
    </div>
  );
}
