"use client";

import { useEffect, useState } from "react";

import { InlineEditableList, InlineEditableColumn } from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Breed, getBreeds, createBreed, updateBreed, deleteBreed, toggleBreedStatus } from "./services";

const COLUMNS: InlineEditableColumn<Breed>[] = [
  { key: "name", label: "Nome", placeholder: "Nome da raça" },
];

function BreedListSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}

export default function BreedList() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getBreeds();
        if (!cancelled) setBreeds(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCreate(values: Record<string, string>) {
    const created = await createBreed(values.name);
    setBreeds((prev) => [...prev, created]);
  }

  async function handleUpdate(id: string, values: Record<string, string>) {
    const updated = await updateBreed(id, values.name);
    setBreeds((prev) => prev.map((breed) => (breed.id === id ? updated : breed)));
  }

  async function handleDelete(id: string) {
    await deleteBreed(id);
    setBreeds((prev) => prev.filter((breed) => breed.id !== id));
  }

  async function handleToggleActive(id: string) {
    const updated = await toggleBreedStatus(id);
    setBreeds((prev) => prev.map((breed) => (breed.id === id ? updated : breed)));
  }

  if (error) {
    return <ErrorPage message="Não foi possível obter as raças." onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return <BreedListSkeleton />;
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Raças</h1>
      <InlineEditableList
        items={breeds}
        columns={COLUMNS}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        itemLabel="raça"
        isActive={(breed) => !breed.deactivatedAt}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
