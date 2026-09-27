"use client";

import { use } from "react";
import { PurchaseForm } from "@/features/purchase/PurchaseForm";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <PurchaseForm id={id} />
    </div>
  );
}
