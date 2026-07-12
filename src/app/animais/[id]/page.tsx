"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import AnimalForm from "../AnimalForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <AnimalForm
        id={id}
        title="Animal"
        onCancel={() => router.back()}
        onSuccess={() => {}}
      />
    </div>
  );
}
