"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import PropertyForm from "../PropertyForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <div className="w-full max-w-200">
        <h1 className="text-3xl font-bold mb-8">Propriedade</h1>
        <PropertyForm
          id={id}
          onCancel={() => router.back()}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
}
