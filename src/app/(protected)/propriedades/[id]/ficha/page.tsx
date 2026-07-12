"use client";

import { use } from "react";
import PropertyDetails from "@/features/property/PropertyDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <PropertyDetails id={id} />
    </div>
  );
}
