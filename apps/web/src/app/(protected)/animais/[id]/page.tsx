"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AnimalEditForm } from "@/features/animal/AnimalEditForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <AnimalEditForm
        id={id}
        title="Editar Animal"
        onCancel={() => router.back()}
        onSuccess={() => {}}
      />
    </div>
  );
}
