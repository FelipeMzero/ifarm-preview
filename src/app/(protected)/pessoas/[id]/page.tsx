"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import PersonForm from "../PersonForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <PersonForm
        id={id}
        title="Pessoa"
        onCancel={() => router.back()}
        onSuccess={() => {}}
      />
    </div>
  );
}
