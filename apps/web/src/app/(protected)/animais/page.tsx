"use client";

import { use } from "react";
import AnimalList from "@/features/animal/AnimalList";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = use(searchParams);

  return (
    <div className="flex justify-center p-8">
      <AnimalList initialQuery={query} />
    </div>
  );
}
