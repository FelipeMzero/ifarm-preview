"use client";

import { use } from "react";
import { AnimalStepPage } from "@/features/management-session/AnimalStepPage";

// Registro do animal: abre no primeiro passo pendente; os passos são URLs filhas
// (ver [passo]) que o próprio AnimalStepPage troca sem remontar a página.
export default function Page({
  params,
}: {
  params: Promise<{ id: string; animalId: string }>;
}) {
  const { id, animalId } = use(params);

  return (
    <div className="flex justify-center p-8">
      <AnimalStepPage sessionId={id} animalId={animalId} />
    </div>
  );
}
