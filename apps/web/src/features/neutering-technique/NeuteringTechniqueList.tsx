"use client";

import { useEffect, useState } from "react";

import {
  InlineEditableList,
  InlineEditableColumn,
} from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { Skeleton } from "@/components/ui/skeleton";
import { neuteringTechniqueClient } from "@/lib/clients";
import { type NeuteringTechnique } from "@ifarm/shared";
import { FIELD_LIMITS } from "@ifarm/shared";

const COLUMNS: InlineEditableColumn<NeuteringTechnique>[] = [
  {
    key: "name",
    label: "Nome",
    placeholder: "Nome da técnica (ex.: Burdizzo, Cirúrgica)",
    maxLength: FIELD_LIMITS.neuteringTechnique.name,
  },
];

function NeuteringTechniqueListSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}

export default function NeuteringTechniqueList() {
  const [techniques, setTechniques] = useState<NeuteringTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await neuteringTechniqueClient.getNeuteringTechniques();
        if (!cancelled) setTechniques(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(values: Record<string, string>) {
    const created = await neuteringTechniqueClient.createNeuteringTechnique(
      values.name,
    );
    setTechniques((prev) => [...prev, created]);
  }

  async function handleUpdate(id: string, values: Record<string, string>) {
    const updated = await neuteringTechniqueClient.updateNeuteringTechnique(
      id,
      values.name,
    );
    setTechniques((prev) =>
      prev.map((technique) => (technique.id === id ? updated : technique)),
    );
  }

  async function handleDelete(id: string) {
    await neuteringTechniqueClient.deleteNeuteringTechnique(id);
    setTechniques((prev) => prev.filter((technique) => technique.id !== id));
  }

  async function handleToggleActive(id: string) {
    const updated =
      await neuteringTechniqueClient.toggleNeuteringTechniqueStatus(id);
    setTechniques((prev) =>
      prev.map((technique) => (technique.id === id ? updated : technique)),
    );
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter as técnicas de castração."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <NeuteringTechniqueListSkeleton />;
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Técnicas de castração</h1>
      <InlineEditableList
        items={techniques}
        columns={COLUMNS}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        itemLabel="técnica de castração"
        isActive={(technique) => !technique.deactivatedAt}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
