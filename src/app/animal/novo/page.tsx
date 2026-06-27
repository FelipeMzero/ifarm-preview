"use client";

import { useRouter } from "next/navigation";
import AnimalForm from "../AnimalForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex justify-center p-8">
      <div className="w-full max-w-200">
        <h1 className="text-3xl font-bold mb-8">Novo Animal</h1>
        <AnimalForm
          onCancel={() => router.back()}
          onSuccess={(newId) => router.replace(`/author/${newId}`)}
        />
      </div>
    </div>
  );
}
