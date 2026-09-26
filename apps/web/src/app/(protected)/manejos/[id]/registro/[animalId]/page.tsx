"use client";

import { use } from "react";
import { AnimalEntry } from "@/features/management-session/AnimalStepPage";

export default function Page({
  params,
}: {
  params: Promise<{ id: string; animalId: string }>;
}) {
  const { id, animalId } = use(params);

  return (
    <div className="flex justify-center p-8">
      <AnimalEntry sessionId={id} animalId={animalId} />
    </div>
  );
}
